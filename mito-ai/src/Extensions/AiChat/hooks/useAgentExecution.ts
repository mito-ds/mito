/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useRef, useState } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { UUID } from '@lumino/coreutils';
import { IStreamlitPreviewManager } from '../../AppPreview/StreamlitPreviewPlugin';
import { CompletionWebsocketClient } from '../../../websockets/completions/CompletionsWebsocketClient';
import { ChatHistoryManager } from '../ChatHistoryManager';
import { createCheckpoint } from '../../../utils/checkpoint';
import { acceptAndRunCellUpdate, retryIfExecutionError, runAllCells } from '../../../utils/agentActions';
import { checkForBlacklistedWords } from '../../../utils/blacklistedWords';
import { getCodeBlockFromMessage } from '../../../utils/strings';
import { getAIOptimizedCellsInNotebookPanel, setActiveCellByIDInNotebookPanel } from '../../../utils/notebook';
import { AgentReviewStatus } from '../ChatTaskpane';

export type AgentExecutionStatus = 'working' | 'stopping' | 'idle';

const AGENT_EXECUTION_DEPTH_LIMIT = 20;

interface UseAgentExecutionProps {
    notebookTracker: INotebookTracker;
    app: JupyterFrontEnd;
    streamlitPreviewManager: IStreamlitPreviewManager;
    websocketClient: CompletionWebsocketClient;
    chatHistoryManagerRef: React.MutableRefObject<ChatHistoryManager>;
    activeThreadIdRef: React.MutableRefObject<string>;
    activeRequestControllerRef: React.MutableRefObject<AbortController | null>;
    setLoadingAIResponse: (loading: boolean) => void;
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
    sendAgentSmartDebugMessage: (errorMessage: string) => Promise<void>;
    agentReview: {
        acceptAllAICode: () => void;
        setNotebookSnapshotPreAgentExecution: (snapshot: any) => void;
    };
    agentTargetNotebookPanelRef: React.MutableRefObject<any>;
    setAgentReviewStatus: (status: AgentReviewStatus) => void;
}

export const useAgentExecution = ({
    notebookTracker,
    app,
    streamlitPreviewManager,
    websocketClient,
    chatHistoryManagerRef,
    activeThreadIdRef,
    activeRequestControllerRef,
    setLoadingAIResponse,
    setAutoScrollFollowMode,
    setHasCheckpoint,
    addAIMessageFromResponseAndUpdateState,
    getDuplicateChatHistoryManager,
    sendAgentExecutionMessage,
    sendAgentSmartDebugMessage,
    agentReview,
    agentTargetNotebookPanelRef
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
        setLoadingAIResponse(false);

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

            // Send stop message to backend
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
        return;
    };

    const startAgentExecution = async (
        input: string,
        setAgentReviewStatus: (status: AgentReviewStatus) => void,
        messageIndex?: number,
        additionalContext?: Array<{ type: string, value: string }>
    ): Promise<void> => {
        agentTargetNotebookPanelRef.current = notebookTracker.currentWidget;

        agentReview.acceptAllAICode();
        agentReview.setNotebookSnapshotPreAgentExecution(getAIOptimizedCellsInNotebookPanel(agentTargetNotebookPanelRef.current));
        await createCheckpoint(app, setHasCheckpoint);
        setAgentExecutionStatus('working');
        setAgentReviewStatus('pre-agent-code-review');

        // Enable follow mode when user starts agent execution
        setAutoScrollFollowMode(true);

        // Reset the execution flag at the start of a new plan
        shouldContinueAgentExecution.current = true;

        let isAgentFinished = false;
        let agentExecutionDepth = 1;
        let sendCellIDOutput: string | undefined = undefined;

        // Sometimes its useful to send extra information back to the agent. For example, 
        // if the agent tries to create a streamlit app and it errors, we want to let the 
        // orchestrator agent know about the issue. 
        // TODO: Ideally this would be a different type of message that does not show up
        // as a user message in the chat taskpane, but this is the only mechanism we have 
        // right now.
        let messageToShareWithAgent: string | undefined = undefined;

        // Loop through each message in the plan and send it to the AI
        while (!isAgentFinished && agentExecutionDepth <= AGENT_EXECUTION_DEPTH_LIMIT) {

            // Check if we should continue execution
            if (!shouldContinueAgentExecution.current) {
                await markAgentForStopping();
                break;
            }

            // Only the first message sent to the Agent should contain the user's input.
            // All other messages only contain updated information about the state of the notebook.
            if (agentExecutionDepth === 1) {
                await sendAgentExecutionMessage(input, messageIndex, undefined, additionalContext);
            } else {
                await sendAgentExecutionMessage(messageToShareWithAgent || '', undefined, sendCellIDOutput);
                // Reset flag back to false until the agent requests the active cell output again
                sendCellIDOutput = undefined;
                messageToShareWithAgent = undefined;
            }

            // Iterate the agent execution depth
            agentExecutionDepth++;

            // Check the code generated by the AI for blacklisted words before running it
            const aiDisplayOptimizedChatItem = chatHistoryManagerRef.current.getLastAIDisplayOptimizedChatItem();

            // # TODO: Make this is a helper function so we can also use it in the auto error fixup! 
            if (aiDisplayOptimizedChatItem) {
                const aiGeneratedCode = getCodeBlockFromMessage(aiDisplayOptimizedChatItem.message);
                if (aiGeneratedCode) {
                    const securityCheck = checkForBlacklistedWords(aiGeneratedCode);
                    if (!securityCheck.safe) {
                        console.error('Security Warning:', securityCheck.reason);
                        addAIMessageFromResponseAndUpdateState(
                            `I cannot execute this code without your approval because this code did not pass my security checks. ${securityCheck.reason}. For your safety, I am stopping execution of this plan.`,
                            'agent:execution',
                            chatHistoryManagerRef.current
                        );
                        await markAgentForStopping();
                        break;
                    }
                }
            }

            const agentResponse = aiDisplayOptimizedChatItem?.agentResponse;

            if (agentTargetNotebookPanelRef.current === null) {
                // If the agent target notebook panel is not set, we don't know where to run the code so we stop
                await markAgentForStopping();
                isAgentFinished = true;
                break;
            }

            if (agentResponse === undefined) {
                // If the agent response is undefined, we need to send a message to the agent
                await markAgentForStopping();
                isAgentFinished = true;
                break;
            }

            if (agentResponse.type === 'finished_task') {
                // If the agent told us that it is finished, we can stop
                await markAgentForStopping();
                isAgentFinished = true;
                break;
            }

            if (agentResponse.type === 'cell_update' && (agentResponse.cell_update === undefined || agentResponse.cell_update === null)) {
                // If the agent's response is not formatted correctly, stop. This is for typechecking mostly
                await markAgentForStopping();
                isAgentFinished = true;
                break;
            }

            // TODO: If we created a validated type in the agent response validation function, then we woulnd't need to do these checks
            if (agentResponse.type === 'edit_streamlit_app' && (agentResponse.edit_streamlit_app_prompt === undefined || agentResponse.edit_streamlit_app_prompt === null)) {
                await markAgentForStopping();
                isAgentFinished = true;
                break;
            }

            if (agentResponse.type === 'cell_update' && agentResponse.cell_update) {
                // Run the code and handle any errors
                await acceptAndRunCellUpdate(
                    agentResponse.cell_update,
                    agentTargetNotebookPanelRef.current,
                );

                const status = await retryIfExecutionError(
                    agentTargetNotebookPanelRef.current,
                    app,
                    sendAgentSmartDebugMessage,
                    shouldContinueAgentExecution,
                    markAgentForStopping,
                    chatHistoryManagerRef
                );

                if (status === 'interupted') {
                    break;
                }

                // If we were not able to run the code, break out of the loop 
                // so we don't continue to execute the plan. Instead, we encourage
                // the user to update the plan and try again. 
                // TODO: Save this message in backend also even if there is not another message sent. 
                // TODO: Move this into the retryIfExecutionError function?
                if (status === 'failure') {
                    addAIMessageFromResponseAndUpdateState(
                        "I apologize, but I was unable to fix the error after 3 attempts. You may want to try rephrasing your request or providing more context.",
                        'agent:execution',
                        chatHistoryManagerRef.current
                    );
                    break;
                }
            }

            if (agentResponse.type === 'get_cell_output' && agentResponse.get_cell_output_cell_id !== null && agentResponse.get_cell_output_cell_id !== undefined) {
                // Mark that we should send the cell output to the agent 
                // in the next loop iteration
                sendCellIDOutput = agentResponse.get_cell_output_cell_id;
            }

            if (agentResponse.type === 'run_all_cells') {
                const result = await runAllCells(app, agentTargetNotebookPanelRef.current);

                // If run_all_cells resulted in an error, handle it through the error fixup process
                if (!result.success && result.errorMessage && result.errorCellId) {
                    // Set the error cell as active so the error retry logic can work with it
                    setActiveCellByIDInNotebookPanel(agentTargetNotebookPanelRef.current, result.errorCellId);

                    const status = await retryIfExecutionError(
                        agentTargetNotebookPanelRef.current,
                        app,
                        sendAgentSmartDebugMessage,
                        shouldContinueAgentExecution,
                        markAgentForStopping,
                        chatHistoryManagerRef
                    );

                    if (status === 'interupted') {
                        break;
                    }

                    if (status === 'failure') {
                        addAIMessageFromResponseAndUpdateState(
                            "I apologize, but I encountered an error while running all cells and was unable to fix it after multiple attempts. You may want to check the notebook for errors.",
                            'agent:execution',
                            chatHistoryManagerRef.current
                        );
                        break;
                    }
                }
            }

            if (agentResponse.type === 'create_streamlit_app') {
                // Create new preview using the service
                const streamlitPreviewResponse = await streamlitPreviewManager.openAppPreview(app, agentTargetNotebookPanelRef.current);
                if (streamlitPreviewResponse.type === 'error') {
                    messageToShareWithAgent = streamlitPreviewResponse.message;
                }
            }

            if (agentResponse.type === 'edit_streamlit_app' && agentResponse.edit_streamlit_app_prompt) {
                // Ensure there is an active preview to edit
                let streamlitPreviewResponse = await streamlitPreviewManager.openAppPreview(app, agentTargetNotebookPanelRef.current);
                if (streamlitPreviewResponse.type === 'error') {
                    messageToShareWithAgent = streamlitPreviewResponse.message;
                    continue;
                }

                // Edit the existing preview
                streamlitPreviewResponse = await streamlitPreviewManager.editExistingPreview(agentResponse.edit_streamlit_app_prompt, agentTargetNotebookPanelRef.current);
                if (streamlitPreviewResponse.type === 'error') {
                    messageToShareWithAgent = streamlitPreviewResponse.message;
                }
            }
        }

        if (agentExecutionDepth > AGENT_EXECUTION_DEPTH_LIMIT) {
            addAIMessageFromResponseAndUpdateState(
                "Since I've been working for a while now, give my work a review and then tell me how to continue.",
                'agent:execution',
                chatHistoryManagerRef.current
            );
        }

        // Use markAgentForStopping for natural conclusion to ensure consistent cleanup
        await markAgentForStopping();
    };

    return {
        // State
        agentExecutionStatus,
        shouldContinueAgentExecution,

        // Functions
        startAgentExecution,
        markAgentForStopping
    };
};
