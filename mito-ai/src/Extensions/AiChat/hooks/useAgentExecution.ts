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
import { acceptAndRunCellUpdate, runAllCells } from '../../../utils/agentActions';
import { checkForBlacklistedWords } from '../../../utils/blacklistedWords';
import { playCompletionSound } from '../../../utils/sound';
import { getAIOptimizedCellsInNotebookPanel, getActiveCellIDInNotebookPanel } from '../../../utils/notebook';
import { AgentReviewStatus } from '../ChatTaskpane';
import { LoadingStatus } from './useChatState';
import { ensureNotebookExists } from '../utils';
import { executeScratchpadCode, formatScratchpadResult } from '../../../utils/scratchpadExecution';
import { getCellOutputByIDInNotebook } from '../../../utils/cellOutput';
import {
    IRequestToolExecutionMessage,
    IAgentFinishedMessage,
    AIOptimizedCell,
} from '../../../websockets/completions/CompletionModels';

export type AgentExecutionStatus = 'working' | 'stopping' | 'idle';

interface UseAgentExecutionProps {
    notebookTracker: INotebookTracker;
    app: JupyterFrontEnd;
    streamlitPreviewManager: IStreamlitPreviewManager;
    websocketClient: CompletionWebsocketClient;
    documentManager: IDocumentManager;
    chatHistoryManagerRef: React.MutableRefObject<ChatHistoryManager>;
    activeThreadIdRef: React.MutableRefObject<string>;
    activeRequestControllerRef: React.MutableRefObject<AbortController | null>;
    setLoadingStatus: (status: LoadingStatus) => void;
    setAutoScrollFollowMode: (mode: boolean) => void;
    setHasCheckpoint: (hasCheckpoint: boolean) => void;
    addAIMessageFromResponseAndUpdateState: (
        messageContent: string,
        promptType: any,
        chatHistoryManager: ChatHistoryManager,
        mitoAIConnectionError?: boolean,
        mitoAIConnectionErrorType?: string | null
    ) => void;
    getDuplicateChatHistoryManager: () => ChatHistoryManager;
    sendAgentExecutionMessage: (
        input: string,
        messageIndex?: number,
        sendCellIDOutput?: string,
        additionalContext?: Array<{ type: string, value: string }>
    ) => Promise<void>;
    // These are kept in the interface for backward compatibility but are no longer
    // used by useAgentExecution — error retry and scratchpad are handled by the
    // backend agent loop via request_tool_execution/tool_result messages.
    sendScratchpadResultMessage: (scratchpadResult: string) => Promise<void>;
    sendAgentSmartDebugMessage: (errorMessage: string) => Promise<void>;
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
        variables?: string[];
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
    notebookTracker,
    app,
    streamlitPreviewManager,
    websocketClient,
    documentManager,
    chatHistoryManagerRef,
    activeThreadIdRef,
    activeRequestControllerRef,
    setLoadingStatus,
    setAutoScrollFollowMode,
    setHasCheckpoint,
    addAIMessageFromResponseAndUpdateState,
    getDuplicateChatHistoryManager,
    sendAgentExecutionMessage,
    sendScratchpadResultMessage,
    sendAgentSmartDebugMessage,
    agentReview,
    agentTargetNotebookPanelRef,
    audioContextRef,
}: UseAgentExecutionProps): {
    agentExecutionStatus: AgentExecutionStatus;
    shouldContinueAgentExecution: React.MutableRefObject<boolean>;
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

        const agentResponse = command.agent_response;

        try {
            switch (agentResponse.type) {
                case 'cell_update': {
                    if (!agentResponse.cell_update) {
                        sendToolResult(websocketClient, command.thread_id, false, {
                            errorMessage: 'cell_update payload is missing',
                            toolType: 'cell_update',
                        });
                        return;
                    }

                    // Security check
                    const securityCheck = checkForBlacklistedWords(agentResponse.cell_update.code);
                    if (!securityCheck.safe) {
                        console.error('Security Warning:', securityCheck.reason);
                        addAIMessageFromResponseAndUpdateState(
                            `I cannot automatically execute this code because it did not pass my security checks. ${securityCheck.reason}. If you decide that this code is safe, you can manually run it.`,
                            'agent:execution',
                            chatHistoryManagerRef.current
                        );
                        sendToolResult(websocketClient, command.thread_id, false, {
                            errorMessage: `Security check failed: ${securityCheck.reason}`,
                            toolType: 'cell_update',
                        });
                        return;
                    }

                    setLoadingStatus('running-code');
                    try {
                        await acceptAndRunCellUpdate(
                            agentResponse.cell_update,
                            notebookPanel,
                        );
                    } finally {
                        setLoadingStatus(undefined);
                    }

                    // Gather updated notebook state
                    const cells = getAIOptimizedCellsInNotebookPanel(notebookPanel);
                    const activeCellId = getActiveCellIDInNotebookPanel(notebookPanel);

                    sendToolResult(websocketClient, command.thread_id, true, {
                        cells: cells,
                        toolType: 'cell_update',
                        activeCellId: activeCellId,
                    });
                    break;
                }

                case 'run_all_cells': {
                    setLoadingStatus('running-code');
                    let result;
                    try {
                        result = await runAllCells(app, notebookPanel);
                    } finally {
                        setLoadingStatus(undefined);
                    }

                    const cells = getAIOptimizedCellsInNotebookPanel(notebookPanel);

                    if (!result.success && result.errorMessage) {
                        sendToolResult(websocketClient, command.thread_id, false, {
                            errorMessage: result.errorMessage,
                            cells: cells,
                            toolType: 'run_all_cells',
                        });
                    } else {
                        sendToolResult(websocketClient, command.thread_id, true, {
                            cells: cells,
                            toolType: 'run_all_cells',
                        });
                    }
                    break;
                }

                case 'get_cell_output': {
                    const cellId = agentResponse.get_cell_output_cell_id;
                    if (!cellId) {
                        sendToolResult(websocketClient, command.thread_id, false, {
                            errorMessage: 'get_cell_output_cell_id is missing',
                            toolType: 'get_cell_output',
                        });
                        return;
                    }

                    const output = await getCellOutputByIDInNotebook(notebookPanel, cellId);

                    sendToolResult(websocketClient, command.thread_id, true, {
                        output: output ?? undefined,
                        toolType: 'get_cell_output',
                    });
                    break;
                }

                case 'scratchpad': {
                    const code = agentResponse.scratchpad_code;
                    if (!code) {
                        sendToolResult(websocketClient, command.thread_id, false, {
                            errorMessage: 'scratchpad_code is missing',
                            toolType: 'scratchpad',
                        });
                        return;
                    }

                    // Security check
                    const scratchpadSecurityCheck = checkForBlacklistedWords(code);
                    if (!scratchpadSecurityCheck.safe) {
                        console.error('Security Warning:', scratchpadSecurityCheck.reason);
                        sendToolResult(websocketClient, command.thread_id, false, {
                            errorMessage: `Security check failed: ${scratchpadSecurityCheck.reason}`,
                            toolType: 'scratchpad',
                        });
                        return;
                    }

                    setLoadingStatus('running-code');
                    let scratchpadResult;
                    try {
                        scratchpadResult = await executeScratchpadCode(
                            notebookPanel,
                            code
                        );
                    } finally {
                        setLoadingStatus(undefined);
                    }

                    const formattedResult = formatScratchpadResult(scratchpadResult);

                    sendToolResult(websocketClient, command.thread_id, scratchpadResult.success, {
                        output: formattedResult,
                        errorMessage: scratchpadResult.error,
                        toolType: 'scratchpad',
                    });
                    break;
                }

                case 'ask_user_question': {
                    // When the agent asks a question, we stop execution on the frontend
                    // and tell the backend the question was delivered.
                    // The backend agent loop will pause waiting for the user's answer.
                    sendToolResult(websocketClient, command.thread_id, true, {
                        output: 'Question delivered to user',
                        toolType: 'ask_user_question',
                    });
                    // Mark agent as stopped so the UI shows the question
                    await markAgentForStopping();
                    break;
                }

                default: {
                    // For types we don't handle on the frontend (create_streamlit_app, etc.)
                    // send a success result so the backend loop continues
                    sendToolResult(websocketClient, command.thread_id, true, {
                        toolType: agentResponse.type,
                    });
                    break;
                }
            }
        } catch (error: any) {
            console.error('Error executing request_tool_execution:', error);
            sendToolResult(websocketClient, command.thread_id, false, {
                errorMessage: error?.message || 'Unknown error executing tool',
                toolType: agentResponse.type,
            });
        }
    }, [
        websocketClient,
        activeThreadIdRef,
        agentTargetNotebookPanelRef,
        shouldContinueAgentExecution,
        setLoadingStatus,
        addAIMessageFromResponseAndUpdateState,
        chatHistoryManagerRef,
        app,
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

        // Display the final message if present
        if (msg.agent_response?.message) {
            addAIMessageFromResponseAndUpdateState(
                msg.agent_response.message,
                'agent:execution',
                chatHistoryManagerRef.current
            );
        }

        await markAgentForStopping();
    }, [activeThreadIdRef, addAIMessageFromResponseAndUpdateState, chatHistoryManagerRef, markAgentForStopping]);

    // Subscribe to request_tool_execution and agent_finished streams
    useEffect(() => {
        const onRequestToolExecution = (_sender: any, command: IRequestToolExecutionMessage) => {
            void handleRequestToolExecution(_sender, command);
        };
        const onAgentFinished = (_sender: any, msg: IAgentFinishedMessage) => {
            void handleAgentFinished(_sender, msg);
        };

        websocketClient.requestToolExecutionMessages.connect(onRequestToolExecution);
        websocketClient.agentFinished.connect(onAgentFinished);

        return () => {
            websocketClient.requestToolExecutionMessages.disconnect(onRequestToolExecution);
            websocketClient.agentFinished.disconnect(onAgentFinished);
        };
    }, [websocketClient, handleRequestToolExecution, handleAgentFinished]);

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
        await sendAgentExecutionMessage(input, messageIndex, undefined, additionalContext);
    };

    return {
        // State
        agentExecutionStatus,
        shouldContinueAgentExecution,

        // Functions
        startAgentExecution,
        markAgentForStopping,
    };
};
