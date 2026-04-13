/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { UUID } from '@lumino/coreutils';
import { IStreamlitPreviewManager } from '../../AppPreview/StreamlitPreviewPlugin';
import { CompletionWebsocketClient } from '../../../websockets/completions/CompletionsWebsocketClient';
import { ChatHistoryManager } from '../ChatHistoryManager';
import { createCheckpoint } from '../../../utils/checkpoint';
import { playCompletionSound } from '../../../utils/sound';
import { getAIOptimizedCellsInNotebookPanel } from '../../../utils/notebook';
import { AgentReviewStatus } from '../ChatTaskpane';
import { LoadingStatus } from './useChatState';
import { ensureNotebookExists } from '../utils';
import { executeAgentTool } from './agentToolExecutor';
import {
    IRequestToolExecutionMessage,
    IAgentFinishedMessage,
    IAssistantResponseMessage,
    IToolResultMessage,
    AIOptimizedCell,
} from '../../../websockets/completions/CompletionModels';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';
import type { Variable } from '../../ContextManager/VariableInspector';

export type AgentExecutionStatus = 'working' | 'stopping' | 'idle';

interface UseAgentExecutionProps {
    contextManager: IContextManager;
    notebookTracker: INotebookTracker;
    app: JupyterFrontEnd;
    streamlitPreviewManager: IStreamlitPreviewManager;
    websocketClient: CompletionWebsocketClient;
    documentManager: IDocumentManager;
    chatHistoryManagerRef: React.MutableRefObject<ChatHistoryManager>;
    activeThreadIdRef: React.MutableRefObject<string>;
    activeRequestControllerRef: React.MutableRefObject<AbortController | null>;
    setLoadingStatus: (status: LoadingStatus) => void;
    setChatHistoryManager: (manager: ChatHistoryManager) => void;
    setAutoScrollFollowMode: (mode: boolean) => void;
    setHasCheckpoint: (hasCheckpoint: boolean) => void;
    addAIMessageFromResponseAndUpdateState: (
        messageContent: string,
        promptType: any,
        chatHistoryManager: ChatHistoryManager,
        mitoAIConnectionError?: boolean,
        mitoAIConnectionErrorType?: string | null
    ) => void;
    addAgentToolFailureUserMessageAndUpdateState: (
        toolErrorDetail: string,
        chatHistoryManager: ChatHistoryManager
    ) => void;
    getDuplicateChatHistoryManager: () => ChatHistoryManager;
    sendAgentExecutionMessage: (
        input: string,
        messageIndex?: number,
        additionalContext?: Array<{ type: string, value: string }>
    ) => Promise<void>;
    agentReview: {
        acceptAllAICode: () => void;
        setNotebookSnapshotPreAgentExecution: (snapshot: any) => void;
    };
    agentTargetNotebookPanelRef: React.MutableRefObject<any>;
    setAgentReviewStatus: (status: AgentReviewStatus) => void;
    audioContextRef: React.MutableRefObject<AudioContext | null>;
}

/**
 * Send a tool_result message back to the backend over the WebSocket.
 * Uses sendOneWay because the backend doesn't reply to tool_result
 * messages — it resolves the JupyterLabToolExecutor's pending future instead.
 */
const sendToolResult = (
    websocketClient: CompletionWebsocketClient,
    threadId: string,
    success: boolean,
    opts: {
        errorMessage?: string;
        cells?: AIOptimizedCell[];
        variables?: Variable[];
        output?: string;
        toolType?: string;
        activeCellId?: string;
        isChromeBrowser?: boolean;
    } = {}
) => {
    websocketClient.sendOneWay({
        type: 'tool_result',
        message_id: UUID.uuid4(),
        metadata: {
            promptType: 'tool_result' as const,
            threadId,
            success,
            errorMessage: opts.errorMessage ?? null,
            cells: opts.cells ?? null,
            variables: opts.variables ?? null,
            output: opts.output ?? null,
            toolType: opts.toolType ?? null,
            activeCellId: opts.activeCellId ?? null,
            isChromeBrowser: opts.isChromeBrowser ?? true,
        },
        stream: false,
    });
};

export const useAgentExecution = ({
    contextManager,
    notebookTracker,
    app,
    streamlitPreviewManager,
    websocketClient,
    documentManager,
    chatHistoryManagerRef,
    activeThreadIdRef,
    activeRequestControllerRef,
    setLoadingStatus,
    setChatHistoryManager,
    setAutoScrollFollowMode,
    setHasCheckpoint,
    addAIMessageFromResponseAndUpdateState,
    addAgentToolFailureUserMessageAndUpdateState,
    getDuplicateChatHistoryManager,
    sendAgentExecutionMessage,
    agentReview,
    agentTargetNotebookPanelRef,
    audioContextRef,
}: UseAgentExecutionProps): {
    agentExecutionStatus: AgentExecutionStatus;
    startAgentExecution: (
        input: string,
        setAgentReviewStatus: (status: AgentReviewStatus) => void,
        messageIndex?: number,
        additionalContext?: Array<{ type: string, value: string }>
    ) => Promise<void>;
    markAgentForStopping: (reason?: 'userStop' | 'naturalConclusion') => Promise<void>;
} => {
    // Agent execution state
    const [agentExecutionStatus, setAgentExecutionStatus] = useState<AgentExecutionStatus>('idle');
    const shouldContinueAgentExecution = useRef<boolean>(true);

    const markAgentForStopping = async (reason: 'userStop' | 'naturalConclusion' = 'naturalConclusion'): Promise<void> => {
        // Signal that the agent should stop immediately
        shouldContinueAgentExecution.current = false;
        // Update state/UI
        setAgentExecutionStatus('idle');
        setLoadingStatus(undefined);

        if (reason === 'userStop') {
            // Immediately abort any ongoing requests
            if (activeRequestControllerRef.current) {
                activeRequestControllerRef.current.abort();
                activeRequestControllerRef.current = null;
            }

            const newChatHistoryManager = getDuplicateChatHistoryManager();
            addAIMessageFromResponseAndUpdateState(
                "Agent stopped by user.",
                'chat', // TODO: This probably should not be type 'chat' because that is reserved for a chat thread!
                newChatHistoryManager
            );

            // Send stop message to backend — this will reject the
            // JupyterLabToolExecutor's pending future and end the agent loop.
            await websocketClient.sendMessage({
                type: "stop_agent",
                message_id: UUID.uuid4(),
                metadata: {
                    promptType: "stop_agent",
                    threadId: activeThreadIdRef.current
                },
                stream: false
            });
        }

        playCompletionSound(audioContextRef.current);
    };

    /**
     * Handle a request_tool_execution from the backend. Executes the requested tool
     * and sends back a tool_result.
     */
    const handleRequestToolExecution = useCallback(async (
        _sender: any,
        command: IRequestToolExecutionMessage
    ): Promise<void> => {
        // Only handle commands for the current thread
        if (command.thread_id !== activeThreadIdRef.current) {
            return;
        }

        // If the agent has been told to stop, don't execute
        if (!shouldContinueAgentExecution.current) {
            return;
        }

        const notebookPanel = agentTargetNotebookPanelRef.current;
        if (!notebookPanel) {
            sendToolResult(websocketClient, command.thread_id, false, {
                errorMessage: 'No notebook panel available',
                toolType: command.agent_response.type,
            });
            return;
        }

        try {
            const executionResult = await executeAgentTool({
                agentResponse: command.agent_response,
                app,
                notebookPanel,
                streamlitPreviewManager,
                contextManager,
                setLoadingStatus,
                addAIMessageFromResponseAndUpdateState,
                chatHistoryManagerRef,
            });

            sendToolResult(websocketClient, command.thread_id, executionResult.success, {
                errorMessage: executionResult.errorMessage,
                cells: executionResult.cells,
                variables: executionResult.variables,
                output: executionResult.output,
                toolType: executionResult.toolType,
                activeCellId: executionResult.activeCellId,
            });

            if (executionResult.shouldStopAgent) {
                await markAgentForStopping();
            }
        } catch (error: any) {
            console.error('Error executing request_tool_execution:', error);
            sendToolResult(websocketClient, command.thread_id, false, {
                errorMessage: error?.message || 'Unknown error executing tool',
                toolType: command.agent_response.type,
            });
        }
    }, [
        websocketClient,
        activeThreadIdRef,
        agentTargetNotebookPanelRef,
        setLoadingStatus,
        addAIMessageFromResponseAndUpdateState,
        chatHistoryManagerRef,
        app,
        streamlitPreviewManager,
        markAgentForStopping,
    ]);

    /**
     * Handle agent_finished from the backend.
     */
    const handleAgentFinished = useCallback(async (
        _sender: any,
        msg: IAgentFinishedMessage
    ): Promise<void> => {
        if (msg.thread_id !== activeThreadIdRef.current) {
            return;
        }

        await markAgentForStopping();
    }, [activeThreadIdRef, markAgentForStopping]);

    const handleAssistantResponse = useCallback(async (
        _sender: any,
        msg: IAssistantResponseMessage
    ): Promise<void> => {
        if (msg.thread_id !== activeThreadIdRef.current || !shouldContinueAgentExecution.current) {
            return;
        }

        const newChatHistoryManager = getDuplicateChatHistoryManager();
        newChatHistoryManager.addAIMessageFromAgentResponse(msg.agent_response);
        setChatHistoryManager(newChatHistoryManager);
        setLoadingStatus(undefined);
    }, [
        activeThreadIdRef,
        getDuplicateChatHistoryManager,
        setChatHistoryManager,
        setLoadingStatus,
    ]);

    const handleBackendToolResult = useCallback(async (
        _sender: any,
        msg: IToolResultMessage
    ): Promise<void> => {
        if (msg.thread_id !== activeThreadIdRef.current || !shouldContinueAgentExecution.current) {
            return;
        }

        // Tool finished; backend is now moving to the next LLM step.
        setLoadingStatus('thinking');

        if (
            msg.tool_result.success &&
            msg.tool_result.tool_name === 'scratchpad' &&
            msg.tool_result.output
        ) {
            const updatedChatHistoryManager = getDuplicateChatHistoryManager();
            const didAttachResult = updatedChatHistoryManager.attachScratchpadResultToLatestScratchpadMessage(
                msg.tool_result.output
            );

            if (didAttachResult) {
                setChatHistoryManager(updatedChatHistoryManager);
            }
        }

        if (!msg.tool_result.success && msg.tool_result.error_message) {
            addAgentToolFailureUserMessageAndUpdateState(
                msg.tool_result.error_message,
                chatHistoryManagerRef.current
            );
        }
    }, [
        activeThreadIdRef,
        setLoadingStatus,
        getDuplicateChatHistoryManager,
        setChatHistoryManager,
        addAgentToolFailureUserMessageAndUpdateState,
        chatHistoryManagerRef,
    ]);

    // Subscribe to agent loop streams
    useEffect(() => {
        const onRequestToolExecution = (_sender: any, command: IRequestToolExecutionMessage) => {
            void handleRequestToolExecution(_sender, command);
        };
        const onAgentFinished = (_sender: any, msg: IAgentFinishedMessage) => {
            void handleAgentFinished(_sender, msg);
        };
        const onAssistantResponse = (_sender: any, msg: IAssistantResponseMessage) => {
            void handleAssistantResponse(_sender, msg);
        };
        const onBackendToolResult = (_sender: any, msg: IToolResultMessage) => {
            void handleBackendToolResult(_sender, msg);
        };

        websocketClient.requestToolExecutionMessages.connect(onRequestToolExecution);
        websocketClient.agentFinished.connect(onAgentFinished);
        websocketClient.assistantResponse.connect(onAssistantResponse);
        websocketClient.backendToolResult.connect(onBackendToolResult);

        return () => {
            websocketClient.requestToolExecutionMessages.disconnect(onRequestToolExecution);
            websocketClient.agentFinished.disconnect(onAgentFinished);
            websocketClient.assistantResponse.disconnect(onAssistantResponse);
            websocketClient.backendToolResult.disconnect(onBackendToolResult);
        };
    }, [
        websocketClient,
        handleRequestToolExecution,
        handleAgentFinished,
        handleAssistantResponse,
        handleBackendToolResult,
    ]);

    const startAgentExecution = async (
        input: string,
        setAgentReviewStatus: (status: AgentReviewStatus) => void,
        messageIndex?: number,
        additionalContext?: Array<{ type: string, value: string }>
    ): Promise<void> => {

        // Ensure a notebook exists before proceeding with agent execution
        const agentTargetNotebookPanel = await ensureNotebookExists(notebookTracker, documentManager);
        agentTargetNotebookPanelRef.current = agentTargetNotebookPanel;

        agentReview.acceptAllAICode();
        agentReview.setNotebookSnapshotPreAgentExecution(getAIOptimizedCellsInNotebookPanel(agentTargetNotebookPanelRef.current));
        await createCheckpoint(app, setHasCheckpoint);
        setAgentExecutionStatus('working');
        setAgentReviewStatus('pre-agent-code-review');

        // Enable follow mode when user starts agent execution
        setAutoScrollFollowMode(true);

        // Reset the execution flag at the start of a new plan
        shouldContinueAgentExecution.current = true;

        // Send the initial agent:execution message to kick off the backend agent loop.
        // The backend will run the LLM loop and send request_tool_execution messages back to us.
        await sendAgentExecutionMessage(input, messageIndex, additionalContext);
    };

    return {
        // State
        agentExecutionStatus,

        // Functions
        startAgentExecution,
        markAgentForStopping,
    };
};
