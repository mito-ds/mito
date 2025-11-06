/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// External libraries
import { Compartment } from '@codemirror/state';
import React, { useEffect, useRef } from 'react';

// JupyterLab imports
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { addIcon, historyIcon, deleteIcon, settingsIcon } from '@jupyterlab/ui-components';
import { ReadonlyPartialJSONObject, UUID } from '@lumino/coreutils';

// Internal imports - Commands
import {
    COMMAND_MITO_AI_APPLY_LATEST_CODE,
    COMMAND_MITO_AI_CELL_TOOLBAR_ACCEPT_CODE,
    COMMAND_MITO_AI_CELL_TOOLBAR_REJECT_CODE,
    COMMAND_MITO_AI_PREVIEW_LATEST_CODE,
    COMMAND_MITO_AI_REJECT_LATEST_CODE,
    COMMAND_MITO_AI_SEND_AGENT_MESSAGE,
    COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE,
    COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE,
} from '../../commands';

// Internal imports - Components
import GroupedErrorsAndFixes from '../../components/AgentComponents/ErrorFixupToolUI';
import DropdownMenu from '../../components/DropdownMenu';
import IconButton from '../../components/IconButton';
import LoadingCircle from '../../components/LoadingCircle';

import ModelSelector from '../../components/ModelSelector';
import NextStepsPills from '../../components/NextStepsPills';
import ToggleButton from '../../components/ToggleButton';

// Internal imports - Icons
import { OpenIndicatorLabIcon } from '../../icons';

// Internal imports - Utils
import { classNames } from '../../utils/classNames';
import { processChatHistoryForErrorGrouping, GroupedErrorMessages } from '../../utils/chatHistory';
import { 
    shouldShowDiffToolbarButtons, 
} from '../../utils/codeDiff';
import { getActiveCellOutput } from '../../utils/cellOutput';
import { OperatingSystem } from '../../utils/user';
import { IStreamlitPreviewManager } from '../AppPreview/StreamlitPreviewPlugin';
import { waitForNotebookReady } from '../../utils/waitForNotebookReady';
import { getBase64EncodedCellOutputInNotebook } from './utils';
import { logEvent } from '../../restAPI/RestAPI';

// Internal imports - Websockets
import type { CompletionWebsocketClient } from '../../websockets/completions/CompletionsWebsocketClient';
import {
    IChatMessageMetadata,
    ICompletionReply,
    ICompletionRequest,
    ICodeExplainCompletionRequest,
    IChatCompletionRequest,
    ISmartDebugCompletionRequest,
    IAgentAutoErrorFixupCompletionRequest,
    IAgentExecutionCompletionRequest,
    AgentResponse,
    ICompletionStreamChunk
} from '../../websockets/completions/CompletionModels';

// Internal imports - Extensions
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import { COMMAND_MITO_AI_SETTINGS } from '../SettingsManager/SettingsManagerPlugin';
import { captureCompletionRequest } from '../SettingsManager/profiler/ProfilerPage';

// Internal imports - Chat components
import AgentReviewPanel from './components/AgentReviewPanel';
import CTACarousel from './CTACarousel';
import UsageBadge, { UsageBadgeRef } from './UsageBadge';
import SignUpForm from './SignUpForm';
import { getFirstMessage } from './FirstMessage';
import ChatInput, { ContextItemAIOptimized } from './ChatMessage/ChatInput';
import ChatMessage from './ChatMessage/ChatMessage';
import ScrollableSuggestions from './ChatMessage/ScrollableSuggestions';
import { ChatHistoryManager, IDisplayOptimizedChatItem, PromptType } from './ChatHistoryManager';

// Internal imports - Hooks
import { useAgentReview } from './hooks/useAgentReview';
import { useAgentExecution } from './hooks/useAgentExecution';
import { useUserSignup } from './hooks/useUserSignup';
import { useChatScroll } from './hooks/useChatScroll';
import { useModelConfig } from './hooks/useModelConfig';
import { useAgentMode } from './hooks/useAgentMode';
import { useStreamingResponse } from './hooks/useStreamingResponse';
import { useChatState } from './hooks/useChatState';
import { useChatThreads } from './hooks/useChatThreads';
import { useCodeReview } from './hooks/useCodeReview';

// Styles
import '../../../style/button.css';
import '../../../style/ChatTaskpane.css';
import '../../../style/TextButton.css';
import LoadingDots from '../../components/LoadingDots';
import { setNotebookID } from '../../utils/notebookMetadata';


const getDefaultChatHistoryManager = (
    notebookTracker: INotebookTracker, 
    contextManager: IContextManager, 
    app: JupyterFrontEnd, 
): ChatHistoryManager => {
    const chatHistoryManager = new ChatHistoryManager(contextManager, notebookTracker, app)
    return chatHistoryManager
}

interface IChatTaskpaneProps {
    notebookTracker: INotebookTracker
    renderMimeRegistry: IRenderMimeRegistry
    contextManager: IContextManager
    streamlitPreviewManager: IStreamlitPreviewManager
    app: JupyterFrontEnd
    operatingSystem: OperatingSystem
    websocketClient: CompletionWebsocketClient
}

// Re-export types from hooks for backward compatibility
export type { CodeReviewStatus, AgentReviewStatus } from './hooks/useChatState';
export type AgentExecutionStatus = 'working' | 'stopping' | 'idle'
export interface ChangedCell {
    cellId: string;
    originalCode: string;
    currentCode: string;
    reviewed: boolean;
}

const ChatTaskpane: React.FC<IChatTaskpaneProps> = ({
    notebookTracker,
    renderMimeRegistry,
    contextManager,
    streamlitPreviewManager,
    app,
    operatingSystem,
    websocketClient,
}) => {

    // User signup state
    const { isSignedUp, refreshUserSignupState } = useUserSignup();

    // Core chat state management
    const {
        chatHistoryManager,
        chatHistoryManagerRef,
        setChatHistoryManager,
        loadingAIResponse,
        setLoadingAIResponse,
        codeReviewStatus,
        setCodeReviewStatus,
        agentReviewStatus,
        setAgentReviewStatus,
        nextSteps,
        setNextSteps,
        displayedNextStepsIfAvailable,
        setDisplayedNextStepsIfAvailable,
    } = useChatState(getDefaultChatHistoryManager(notebookTracker, contextManager, app));

    // Chat scroll management
    const { chatTaskpaneMessagesRef, setAutoScrollFollowMode } = useChatScroll(chatHistoryManager);

    // Model configuration
    const { updateModelOnBackend, getInitialModel } = useModelConfig(websocketClient);

    // Ref to trigger refresh of the usage badge
    const usageBadgeRef = useRef<UsageBadgeRef>(null);

    // Streaming response management
    const { streamingContentRef, streamHandlerRef, activeRequestControllerRef } = useStreamingResponse();

    // Agent mode state management
    const {
        agentModeEnabled,
        agentModeEnabledRef,
        setAgentModeEnabled,
        hasCheckpoint,
        setHasCheckpoint,
        showRevertQuestionnaire,
        setShowRevertQuestionnaire,
    } = useAgentMode();

    // Create a shared ref for the agent target notebook panel
    const agentTargetNotebookPanelRef = React.useRef<any>(null);

    // Initialize code diff stripes compartments (needed by both agentReview and codeReview)
    const codeDiffStripesCompartments = React.useRef(new Map<string, Compartment>());

    // Update cell toolbar buttons function (needed by multiple hooks)
    const updateCellToolbarButtons = (): void => {
        // Tell Jupyter to re-evaluate if the toolbar buttons should be visible.
        // Without this, the user needs to take some action, like switching to a different cell 
        // and then switching back in order for the Jupyter to re-evaluate if it should
        // show the toolbar buttons.
        app.commands.notifyCommandChanged(COMMAND_MITO_AI_CELL_TOOLBAR_ACCEPT_CODE);
        app.commands.notifyCommandChanged(COMMAND_MITO_AI_CELL_TOOLBAR_REJECT_CODE);
    };

    // Initialize agent review hook (needed before useCodeReview)
    const agentReview = useAgentReview({
        app,
        agentTargetNotebookPanelRef,
        codeDiffStripesCompartments,
        setAgentReviewStatus,
        updateCellToolbarButtons,
    });

    // Code review management
    const {
        cellStateBeforeDiff,
        previewAICodeToActiveCell,
        acceptAICode,
        rejectAICode,
    } = useCodeReview({
        notebookTracker,
        chatHistoryManagerRef,
        setCodeReviewStatus,
        updateCellToolbarButtons,
        agentReview,
        codeDiffStripesCompartments,
    });

    // Chat threads management
    const {
        chatThreads,
        activeThreadIdRef,
        fetchChatThreads,
        fetchChatHistoryAndSetActiveThread,
        deleteThread,
        startNewChat,
    } = useChatThreads({
        websocketClient,
        notebookTracker,
        contextManager,
        app,
        streamlitPreviewManager,
        chatHistoryManager,
        chatHistoryManagerRef,
        setChatHistoryManager,
        setAgentModeEnabled,
        setNextSteps,
        setShowRevertQuestionnaire,
        setHasCheckpoint,
        setAutoScrollFollowMode,
        agentReview,
        getDefaultChatHistoryManager,
    });

    const getDuplicateChatHistoryManager = (): ChatHistoryManager => {

        /*
            We use getDuplicateChatHistoryManager() instead of directly accessing the state variable because 
            the COMMAND_MITO_AI_SEND_MESSAGE is registered in a useEffect on initial render, which
            would otherwise always use the initial state values. By using a function, we ensure we always
            get the most recent chat history, even when the command is executed later.        
        */
        return chatHistoryManagerRef.current.createDuplicateChatHistoryManager()
    }

    /* 
        Send a message with a specific input, clearing what is currently in the chat input.
        This is useful when we want to send the error message from the MIME renderer directly
        to the AI chat.
    */
    const sendSmartDebugMessage = async (errorMessage: string): Promise<void> => {
        // Check if user is in agent mode and switch to chat mode if needed
        if (agentModeEnabledRef.current) {
            await startNewChat();
            setAgentModeEnabled(false);
            // Clear agent checkpoint when switching modes
            setHasCheckpoint(false);
        }

        // Step 0: reset the state for a new message
        resetForNewMessage()

        // Enable follow mode when sending a debug message
        setAutoScrollFollowMode(true);

        // Step 1: Add the smart debug message to the chat history
        const newChatHistoryManager = getDuplicateChatHistoryManager()

        const smartDebugMetadata = newChatHistoryManager.addSmartDebugMessage(activeThreadIdRef.current, errorMessage)
        setChatHistoryManager(newChatHistoryManager);
        setLoadingAIResponse(true)

        // Step 2: Send the message to the AI
        const smartDebugCompletionRequest: ISmartDebugCompletionRequest = {
            type: 'smartDebug',
            message_id: UUID.uuid4(),
            metadata: smartDebugMetadata,
            stream: true
        }
        await _sendMessageAndSaveResponse(smartDebugCompletionRequest, newChatHistoryManager)
    }

    const sendAgentSmartDebugMessage = async (errorMessage: string): Promise<void> => {
        if (agentTargetNotebookPanelRef.current === null) {
            return
        }

        // Step 0: reset the state for a new message
        resetForNewMessage()

        // Enable follow mode when sending agent debug message (same behavior as other modes)
        setAutoScrollFollowMode(true);

        // Step 1: Create message metadata
        const newChatHistoryManager = getDuplicateChatHistoryManager()
        const agentSmartDebugMessage = newChatHistoryManager.addAgentSmartDebugMessage(
            activeThreadIdRef.current, 
            errorMessage,
            agentTargetNotebookPanelRef.current
        )
        setChatHistoryManager(newChatHistoryManager);
        setLoadingAIResponse(true);

        // Step 2: Send the message to the AI
        const smartDebugCompletionRequest: IAgentAutoErrorFixupCompletionRequest = {
            type: 'agent:autoErrorFixup',
            message_id: UUID.uuid4(),
            metadata: agentSmartDebugMessage,
            stream: false
        }
        await _sendMessageAndSaveResponse(smartDebugCompletionRequest, newChatHistoryManager)
    }

    const sendExplainCodeMessage = async (): Promise<void> => {
        // Step 0: reset the state for a new message
        resetForNewMessage()

        // Enable follow mode when explaining code
        setAutoScrollFollowMode(true);

        // Step 1: Add the code explain message to the chat history
        const newChatHistoryManager = getDuplicateChatHistoryManager()

        const explainCodeMetadata = newChatHistoryManager.addExplainCodeMessage(activeThreadIdRef.current)
        setChatHistoryManager(newChatHistoryManager)
        setLoadingAIResponse(true)

        // Step 2: Send the message to the AI
        const explainCompletionRequest: ICodeExplainCompletionRequest = {
            type: 'codeExplain',
            message_id: UUID.uuid4(),
            metadata: explainCodeMetadata,
            stream: true
        }
        await _sendMessageAndSaveResponse(explainCompletionRequest, newChatHistoryManager)

        // Step 3: No post processing step needed for explaining code. 
    }

    const sendAgentExecutionMessage = async (
        input: string,
        messageIndex?: number,
        sendCellIDOutput: string | undefined = undefined,
        additionalContext?: Array<{type: string, value: string}>
    ): Promise<void> => {

        // Step 0: reset the state for a new message
        resetForNewMessage()

        const agentTargetNotebookPanel = agentTargetNotebookPanelRef.current

        if (agentTargetNotebookPanel === null) {
            return
        }

        // Step 1: Add the user's message to the chat history
        const newChatHistoryManager = getDuplicateChatHistoryManager()

        if (messageIndex !== undefined) {
            // Drop all of the messages starting at the message index
            newChatHistoryManager.dropMessagesStartingAtIndex(messageIndex)
        }

        const agentExecutionMetadata = newChatHistoryManager.addAgentExecutionMessage(
            activeThreadIdRef.current, 
            agentTargetNotebookPanel,
            input,
            additionalContext
        )
        if (messageIndex !== undefined) {
            agentExecutionMetadata.index = messageIndex
        }

        agentExecutionMetadata.base64EncodedActiveCellOutput = await getBase64EncodedCellOutputInNotebook(agentTargetNotebookPanel, sendCellIDOutput)

        setChatHistoryManager(newChatHistoryManager)
        setLoadingAIResponse(true);

        // Step 2: Send the message to the AI
        const completionRequest: IAgentExecutionCompletionRequest = {
            type: 'agent:execution',
            message_id: UUID.uuid4(),
            metadata: agentExecutionMetadata,
            stream: false
        }
        await _sendMessageAndSaveResponse(completionRequest, newChatHistoryManager)
    }

    /* 
        Send whatever message is currently in the chat input
    */
    const sendChatInputMessage = async (input: string, messageIndex?: number, additionalContext?: Array<{type: string, value: string}>): Promise<void> => {
        // Step 0: reset the state for a new message
        resetForNewMessage()

        // Enable follow mode when user sends a new message
        setAutoScrollFollowMode(true);

        // Step 1: Add the user's message to the chat history
        const newChatHistoryManager = getDuplicateChatHistoryManager()

        if (messageIndex !== undefined) {
            // Drop all of the messages starting at the message index
            newChatHistoryManager.dropMessagesStartingAtIndex(messageIndex)
        }

        const chatMessageMetadata: IChatMessageMetadata = await newChatHistoryManager.addChatInputMessage(
            input,
            activeThreadIdRef.current,
            messageIndex,
            additionalContext
        )

        setChatHistoryManager(newChatHistoryManager)
        setLoadingAIResponse(true)

        // Yield control briefly to allow React to re-render the UI
        // A timeout of 0ms pushes the rest of the function to the next event loop cycle
        // so we don't get stuck behind the slow getActiveCellOutput function.
        await new Promise(resolve => setTimeout(resolve, 0));

        // Add the active cell output to the metadata afterwards setting the chatHistoryManager so that 
        // we don't have to wait on turning the output into a base64 image before we can add the user's message
        // to the chat.
        const activeCellOutput = await getActiveCellOutput(notebookTracker)
        if (activeCellOutput !== undefined) {
            chatMessageMetadata.base64EncodedActiveCellOutput = activeCellOutput
        }

        const completionRequest: IChatCompletionRequest = {
            type: 'chat',
            message_id: UUID.uuid4(),
            metadata: chatMessageMetadata,
            stream: true
        }

        // Step 2: Send the message to the AI
        await _sendMessageAndSaveResponse(completionRequest, newChatHistoryManager)
    }

    const handleSubmitUserMessage = async (
        newContent: string,
        messageIndex?: number, // The index of the message to replace. Undefined if adding a new message instead of editing existing message.
        additionalContext?: ContextItemAIOptimized[]
    ): Promise<void> => {

        // Then send the new message to replace it
        if (agentModeEnabled) {
            await agentExecution.startAgentExecution(newContent, setAgentReviewStatus, messageIndex, additionalContext)
        } else {
            await sendChatInputMessage(newContent, messageIndex, additionalContext)
        }
    };

    const _sendMessageAndSaveResponse = async (
        completionRequest: ICompletionRequest, newChatHistoryManager: ChatHistoryManager
    ): Promise<boolean> => {
        // Create AbortController for this request
        const abortController = new AbortController();
        activeRequestControllerRef.current = abortController;
        
        // Capture the completion request for debugging
        captureCompletionRequest(completionRequest);
        if (completionRequest.stream) {
            // Reset the streaming response and set streaming state
            streamingContentRef.current = '';

            // Disconnect any existing stream handler
            if (streamHandlerRef.current) {
                websocketClient.stream.disconnect(streamHandlerRef.current, null);
                streamHandlerRef.current = null;
            }

            // Create the stream handler function and store it in the ref
            const streamHandler = (_: CompletionWebsocketClient, chunk: ICompletionStreamChunk): void => {
                if (chunk.error) {
                    console.group('Error calling OpenAI API:');
                    console.error('Title:', chunk.error.title);
                    console.error('Type:', chunk.error.error_type);
                    console.error('Hint:', chunk.error.hint);
                    console.log('Full Error Details:', chunk.error);
                    console.groupEnd();

                    // Log traceback separately to preserve formatting
                    if (chunk.error.traceback) {
                        console.group('Error Traceback:');
                        console.error(chunk.error.traceback);
                        console.groupEnd();
                    }

                    addAIMessageFromResponseAndUpdateState(
                        chunk.error.hint || chunk.error.title || "An error occurred",
                        completionRequest.metadata.promptType,
                        newChatHistoryManager,
                        true,
                        chunk.error.title
                    );
                    setLoadingAIResponse(false);
                } else if (chunk.done) {
                    // Reset states to allow future messages to show the "Apply" button
                    setCodeReviewStatus('chatPreview');
                } else {
                    // Use a ref to accumulate the content properly
                    streamingContentRef.current += chunk.chunk.content;

                    // Create a new chat history manager instance to ensure React detects the state change
                    const updatedChatHistoryManager = newChatHistoryManager.createDuplicateChatHistoryManager();
                    updatedChatHistoryManager.addStreamingAIMessage(
                        streamingContentRef.current,
                        completionRequest.metadata.promptType,
                    );
                    setChatHistoryManager(updatedChatHistoryManager);

                    // Set loading to false after we receive the first chunk
                    if (streamingContentRef.current.length > 0) {
                        setLoadingAIResponse(false);
                    }
                }
            };

            // Store the handler for later cleanup
            streamHandlerRef.current = streamHandler;

            // Connect the handler
            websocketClient.stream.connect(streamHandler, null);

            try {
                const aiResponse = await websocketClient.sendMessage<ICompletionRequest, ICompletionReply>(completionRequest);
                
                const content = aiResponse.items[0]?.content ?? '';

                if (
                    completionRequest.metadata.promptType === 'agent:execution' ||
                    completionRequest.metadata.promptType === 'agent:autoErrorFixup'
                ) {
                    // Agent:Execution prompts return a CellUpdate object that we need to parse
                    const agentResponse: AgentResponse = JSON.parse(content)
                    newChatHistoryManager.addAIMessageFromAgentResponse(agentResponse)
                }
            } catch (error) {
                addAIMessageFromResponseAndUpdateState(
                    (error as any).title ? (error as any).title : `${error}`,
                    'chat',
                    newChatHistoryManager,
                    false
                );
                addAIMessageFromResponseAndUpdateState(
                    (error as any).hint ? (error as any).hint : `${error}`,
                    completionRequest.metadata.promptType,
                    newChatHistoryManager,
                    true
                );
            }
        } else {
            // NON-STREAMING RESPONSES
            // Once we move everything to streaming, we can remove everything in this else block
            try {
                // Check if request was aborted before making the call
                if (abortController.signal.aborted) {
                    throw new Error('Request aborted');
                }
                
                const aiResponse = await websocketClient.sendMessage<ICompletionRequest, ICompletionReply>(completionRequest);
                
                // Check if request was aborted after receiving response
                if (abortController.signal.aborted) {
                    throw new Error('Request aborted');
                }

                if (aiResponse.error) {

                    console.group('Error calling OpenAI API:');
                    console.error('Title:', aiResponse.error.title);
                    console.error('Type:', aiResponse.error.error_type);
                    console.error('Hint:', aiResponse.error.hint);
                    console.log('Full Error Details:', aiResponse.error);
                    console.groupEnd();

                    // Log traceback separately to preserve formatting
                    if (aiResponse.error.traceback) {
                        console.group('Error Traceback:');
                        console.error(aiResponse.error.traceback);
                        console.groupEnd();
                    }

                    addAIMessageFromResponseAndUpdateState(
                        aiResponse.error.hint
                            ? aiResponse.error.hint
                            : `${aiResponse.error.error_type}: ${aiResponse.error.title}`,
                        completionRequest.metadata.promptType,
                        newChatHistoryManager,
                        true,
                        aiResponse.error.title
                    );
                } else {
                    const content = aiResponse.items[0]?.content ?? '';

                    if (completionRequest.metadata.promptType === 'agent:execution' || completionRequest.metadata.promptType === 'agent:autoErrorFixup') {
                        // Agent:Execution prompts return a CellUpdate object that we need to parse
                        const agentResponse: AgentResponse = JSON.parse(content)
                        newChatHistoryManager.addAIMessageFromAgentResponse(agentResponse)
                    } else {
                        // For all other prompt types, we can just add the content to the chat history
                        aiResponse.items.forEach((item: any) => {
                            newChatHistoryManager.addAIMessageFromResponse(
                                item.content || '',
                                completionRequest.metadata.promptType
                            );
                        });
                        setChatHistoryManager(newChatHistoryManager);
                    }
                }
            } catch (error) {
                // Check if this was an abort error
                if ((error as any).message === 'Request aborted') {
                    // Don't show error message for aborted requests
                    return false;
                }
                
                addAIMessageFromResponseAndUpdateState(
                    (error as any).title ? (error as any).title : `${error}`,
                    'chat',
                    newChatHistoryManager,
                    false
                );
                addAIMessageFromResponseAndUpdateState(
                    (error as any).hint ? (error as any).hint : `${error}`,
                    completionRequest.metadata.promptType,
                    newChatHistoryManager,
                    true
                )
            } finally {
                // Reset states to allow future messages to show the "Apply" button
                setCodeReviewStatus('chatPreview');
                setLoadingAIResponse(false);
            }
        }

        // Clean up AbortController
        if (activeRequestControllerRef.current === abortController) {
            activeRequestControllerRef.current = null;
        }

        // Refresh the usage badge to reflect updated usage count
        if (usageBadgeRef.current) {
            void usageBadgeRef.current.refresh();
        }

        return true
    }

    const addAIMessageFromResponseAndUpdateState = (
        messageContent: string,
        promptType: PromptType,
        chatHistoryManager: ChatHistoryManager,
        mitoAIConnectionError: boolean = false,
        mitoAIConnectionErrorType: string | null = null
    ): void => {
        /* 
        Adds a new message to the chat history and updates the state. If we don't update the state 
        then the chat history does not update in the UI. 
        */
        chatHistoryManager.addAIMessageFromResponse(messageContent, promptType, mitoAIConnectionError, mitoAIConnectionErrorType)
        setChatHistoryManager(chatHistoryManager)
    }

    // Initialize agent execution hook
    const agentExecution = useAgentExecution({
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
        agentTargetNotebookPanelRef,
        setAgentReviewStatus
    });

    // Main initialization effect - runs once on mount
    useEffect(() => {
        const initializeChatHistory = async (): Promise<void> => {
            try {
                // Get initial model from localStorage or default
                const initialModel = getInitialModel();

                // Set the model on backend when the taskpane is opened
                void updateModelOnBackend(initialModel);

                // 1. Fetch available chat threads.
                const fetchedThreads = await fetchChatThreads();

                // 2. If threads exist, load the latest thread; otherwise, start a new chat.
                if (fetchedThreads.length > 0) {
                    const latestThread = fetchedThreads[0]!;
                    await fetchChatHistoryAndSetActiveThread(latestThread.thread_id);
                } else {
                    await startNewChat();
                }

                const firstMessage = getFirstMessage();
                if (firstMessage) {
                    await waitForNotebookReady(notebookTracker);
                    await startNewChat();
                    await agentExecution.startAgentExecution(firstMessage, setAgentReviewStatus);
                }

            } catch (error: unknown) {
                const newChatHistoryManager = getDefaultChatHistoryManager(
                    notebookTracker,
                    contextManager,
                    app,
                );
                addAIMessageFromResponseAndUpdateState(
                    (error as { title?: string }).title ? (error as { title?: string }).title! : `${error}`,
                    'chat',
                    newChatHistoryManager,
                    false
                );
                addAIMessageFromResponseAndUpdateState(
                    (error as { hint?: string }).hint ? (error as { hint?: string }).hint! : `${error}`,
                    'chat',
                    newChatHistoryManager,
                    true
                );
            }
        };

        void logEvent('opened_ai_chat_taskpane');
        void initializeChatHistory(); 
        void refreshUserSignupState(); // Get user signup state when the component first mounts

        /**** 
         * Give each notebook a Unique ID so that we can associate notebooks
         * to specific app files
         * ****/
        const handleNotebookPanelChanged = (): void => {
            setNotebookID(notebookTracker.currentWidget)
        };

        // Event fires every time the active notebook panel changes
        notebookTracker.currentChanged.connect(handleNotebookPanelChanged);
        
        return () => {
            notebookTracker.currentChanged.disconnect(handleNotebookPanelChanged);
        };

    }, [websocketClient]);

    const displayOptimizedChatHistory = chatHistoryManager.getDisplayOptimizedHistory()

    const resetForNewMessage = (): void => {
        /* 
        Before we send the next user message, we need to reset the state for a new message:
        - Reject the previous Ai generated code if they did not accept it yet
        - Clear the next steps
        */
        rejectAICode()
        setNextSteps([])
        setShowRevertQuestionnaire(false);
    }

    useEffect(() => {
        /* 
            Add a new command to the JupyterLab command registry that applies the latest AI generated code
            to the active code cell. Do this inside of the useEffect so that we only register the command
            the first time we create the chat. Registering the command when it is already created causes
            errors.
        */
        app.commands.addCommand(COMMAND_MITO_AI_PREVIEW_LATEST_CODE, {
            execute: () => {
                previewAICodeToActiveCell()
            }
        });

        app.commands.addCommand(COMMAND_MITO_AI_APPLY_LATEST_CODE, {
            execute: () => {
                acceptAICode()
            }
        });

        app.commands.addCommand(COMMAND_MITO_AI_REJECT_LATEST_CODE, {
            execute: () => {
                rejectAICode()
            }
        });

        /* 
            Add a new command to the JupyterLab command registry that sends the current chat message.
            We use this to automatically send the message when the user adds an error to the chat. 
        */
        app.commands.addCommand(COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE, {
            execute: async (args?: ReadonlyPartialJSONObject) => {
                if (args?.input) {
                    await sendSmartDebugMessage(args.input.toString())
                }
            }
        });

        app.commands.addCommand(COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE, {
            execute: async () => {
                await sendExplainCodeMessage()
            }
        });

        app.commands.addCommand(COMMAND_MITO_AI_SEND_AGENT_MESSAGE, {
            execute: async (args?: ReadonlyPartialJSONObject) => {
                if (args?.input) {
                    // If its not already in agent mode, start a new chat in agent mode
                    if (!agentModeEnabledRef.current) {
                        await startNewChat();
                        setAgentModeEnabled(true);
                    }

                    // Wait for the next tick to ensure state update is processed
                    await new Promise(resolve => setTimeout(resolve, 0));

                    await agentExecution.startAgentExecution(args.input.toString(), setAgentReviewStatus)
                }
            }
        });


        /* 
            Register the code cell toolbar buttons for accepting and rejecting code.
        */
        app.commands.addCommand(COMMAND_MITO_AI_CELL_TOOLBAR_ACCEPT_CODE, {
            label: `Accept ${operatingSystem === 'mac' ? '⌘Y' : 'Ctrl+Y'}`,
            className: 'text-button-mito-ai button-base button-green',
            caption: 'Accept Code',
            execute: acceptAICode,
            isVisible: () => shouldShowDiffToolbarButtons(notebookTracker, cellStateBeforeDiff.current, agentReview.changedCellsRef.current)
        });

        app.commands.addCommand(COMMAND_MITO_AI_CELL_TOOLBAR_REJECT_CODE, {
            label: `Reject ${operatingSystem === 'mac' ? '⌘U' : 'Ctrl+U'}`,
            className: 'text-button-mito-ai button-base button-red',
            caption: 'Reject Code',
            execute: rejectAICode,
            isVisible: () => shouldShowDiffToolbarButtons(notebookTracker, cellStateBeforeDiff.current, agentReview.changedCellsRef.current)
        });
    }, []);

    useEffect(() => {
        // Register keyboard shortcuts 
        // In agent mode, always apply code directly. In chat mode, preview first if in chatPreview status.
        let command: string;
        if (agentModeEnabled) {
            command = COMMAND_MITO_AI_APPLY_LATEST_CODE;
        } else if (codeReviewStatus === 'chatPreview') {
            command = COMMAND_MITO_AI_PREVIEW_LATEST_CODE;
        } else {
            command = COMMAND_MITO_AI_APPLY_LATEST_CODE;
        }

        const accelYDisposable = app.commands.addKeyBinding({
            command,
            keys: ['Accel Y'],
            selector: 'body',
        });

        const accelDDisposable = app.commands.addKeyBinding({
            command: COMMAND_MITO_AI_REJECT_LATEST_CODE,
            keys: ['Accel U'],
            selector: 'body',
            preventDefault: true,
        });


        // Clean up the key bindings when the component unmounts or when codeReviewStatus changes
        // This prevents keyboard shortcuts from persisting when they shouldn't.
        return () => {
            accelYDisposable.dispose();
            accelDDisposable.dispose();
        };
    }, [codeReviewStatus, agentModeEnabled]);

    // Update toolbar buttons when active cell changes
    // TODO: Check if we actually need this
    useEffect(() => {
        const handleActiveCellChanged = (): void => {
            updateCellToolbarButtons();
        };

        const currentWidget = notebookTracker.currentWidget;
        if (currentWidget) {
            currentWidget.content.activeCellChanged.connect(handleActiveCellChanged);
            
            return () => {
                currentWidget.content.activeCellChanged.disconnect(handleActiveCellChanged);
            };
        }
        
        return undefined;
    }, [notebookTracker.currentWidget]);

    const lastAIMessagesIndex = chatHistoryManager.getLastAIMessageIndex()

    let processedDisplayOptimizedChatHistory: (IDisplayOptimizedChatItem | GroupedErrorMessages)[] = []
    
    // In agent mode, we group consecutive error messages together. 
    // In chat mode, we display messages individually as they were sent
    if (agentModeEnabled) {
        processedDisplayOptimizedChatHistory = processChatHistoryForErrorGrouping(
            chatHistoryManager.getDisplayOptimizedHistory()
        );
    } else {
        processedDisplayOptimizedChatHistory = chatHistoryManager.getDisplayOptimizedHistory()
    }

    // Type guard function to check if an item is GroupedErrorMessages
    const isGroupedErrorMessages = (item: GroupedErrorMessages | IDisplayOptimizedChatItem): item is GroupedErrorMessages => {
        return Array.isArray(item);
    };


    return (
        // We disable the chat taskpane if the user is not signed up AND there are no chat history items
        <div className={classNames('chat-taskpane', { 'disabled': !(isSignedUp || displayOptimizedChatHistory.length > 0) })}>
            <div className="chat-taskpane-header">
                <div className="chat-taskpane-header-left">
                    <IconButton
                        icon={<settingsIcon.react />}
                        title="Mito AI Settings"
                        onClick={() => {
                            void app.commands.execute(COMMAND_MITO_AI_SETTINGS);
                        }}
                    />
                    <UsageBadge app={app} ref={usageBadgeRef} />
                </div>
                <div className="chat-taskpane-header-right">
                    <IconButton
                        icon={<addIcon.react />}
                        title="Start New Chat"
                        onClick={async () => { await startNewChat() }}
                    />
                    <DropdownMenu
                        trigger={
                            <button className="icon-button" title="Chat Threads" onClick={fetchChatThreads}>
                                <historyIcon.react />
                            </button>
                        }
                        items={chatThreads.length > 0
                            ? chatThreads.map(thread => ({
                                label: thread.name,
                                primaryIcon: activeThreadIdRef.current === thread.thread_id ? OpenIndicatorLabIcon.react : undefined,
                                onClick: () => fetchChatHistoryAndSetActiveThread(thread.thread_id),
                                secondaryActions: [
                                    {
                                        icon: deleteIcon.react,
                                        onClick: () => deleteThread(thread.thread_id),
                                        tooltip: 'Delete this chat',
                                    }
                                ]
                            }))
                            : [{
                                label: "No chat history available",
                                disabled: true,
                                onClick: () => { }
                            }]
                        }
                        alignment="right"
                    />
                </div>
            </div>
            <div className="chat-messages" ref={chatTaskpaneMessagesRef}>
                {displayOptimizedChatHistory.length === 0 &&
                    <div className="chat-empty-message">
                        {isSignedUp === false 
                            ? <SignUpForm onSignUpSuccess={refreshUserSignupState} /> 
                            : <CTACarousel app={app} />
                        }
                    </div>
                }
                {processedDisplayOptimizedChatHistory.map((displayOptimizedChat, index) => {
                    if (isGroupedErrorMessages(displayOptimizedChat)) {
                        return (
                            <GroupedErrorsAndFixes
                                key={index}
                                messages={displayOptimizedChat}
                                renderMimeRegistry={renderMimeRegistry}
                            />
                        )
                    } else {
                        return (
                            <ChatMessage
                                key={index}
                                message={displayOptimizedChat.message}
                                promptType={displayOptimizedChat.promptType}
                                agentResponse={displayOptimizedChat.agentResponse}
                                codeCellID={displayOptimizedChat.codeCellID}
                                mitoAIConnectionError={displayOptimizedChat.type === 'connection error'}
                                mitoAIConnectionErrorType={displayOptimizedChat.mitoAIConnectionErrorType || null}
                                messageIndex={index}
                                notebookTracker={notebookTracker}
                                renderMimeRegistry={renderMimeRegistry}
                                app={app}
                                isLastAiMessage={index === lastAIMessagesIndex}
                                isLastMessage={index === displayOptimizedChatHistory.length - 1}
                                operatingSystem={operatingSystem}
                                previewAICode={previewAICodeToActiveCell}
                                acceptAICode={acceptAICode}
                                rejectAICode={rejectAICode}
                                handleSubmitUserMessage={handleSubmitUserMessage}
                                contextManager={contextManager}
                                codeReviewStatus={codeReviewStatus}
                                setNextSteps={setNextSteps}
                                agentModeEnabled={agentModeEnabled}
                                additionalContext={displayOptimizedChat.additionalContext}
                            />
                        )
                    }
                }).filter(message => message !== null)}
                {loadingAIResponse &&
                    <div className="chat-loading-message">
                        Thinking <LoadingDots />
                    </div>
                }
                {/* Agent review panel - handles all agent review UI */}
                <AgentReviewPanel
                    hasCheckpoint={hasCheckpoint}
                    agentModeEnabled={agentModeEnabled}
                    agentExecutionStatus={agentExecution.agentExecutionStatus}
                    displayOptimizedChatHistoryLength={displayOptimizedChatHistory.length}
                    showRevertQuestionnaire={showRevertQuestionnaire}
                    reviewAgentChanges={agentReview.reviewAgentChanges}
                    acceptAllAICode={agentReview.acceptAllAICode}
                    rejectAllAICode={agentReview.rejectAllAICode}
                    getChangeCounts={agentReview.getChangeCounts}
                    getReviewProgress={agentReview.getReviewProgress}
                    setHasCheckpoint={setHasCheckpoint}
                    setDisplayedNextStepsIfAvailable={setDisplayedNextStepsIfAvailable}
                    setShowRevertQuestionnaire={setShowRevertQuestionnaire}
                    getDuplicateChatHistoryManager={getDuplicateChatHistoryManager}
                    setChatHistoryManager={setChatHistoryManager}
                    app={app}
                    notebookTracker={notebookTracker}
                    chatTaskpaneMessagesRef={chatTaskpaneMessagesRef}
                    agentReviewStatus={agentReviewStatus}
                    setAgentReviewStatus={setAgentReviewStatus}
                />
            </div>
            {displayOptimizedChatHistory.length === 0 && (
                <div className="suggestions-container">
                    <ScrollableSuggestions
                        onSelectSuggestion={(prompt) => {
                            if (agentModeEnabled) {
                                void agentExecution.startAgentExecution(prompt, setAgentReviewStatus);
                            } else {
                                void sendChatInputMessage(prompt);
                            }
                        }}
                    />
                </div>
            )}
            <div className={`connected-input-container ${nextSteps.length > 0 ? 'has-next-steps' : ''}`}>
                {nextSteps.length > 0 && (
                    <NextStepsPills
                        nextSteps={nextSteps}
                        onSelectNextStep={agentExecution.startAgentExecution}
                        displayedNextStepsIfAvailable={displayedNextStepsIfAvailable}
                        setDisplayedNextStepsIfAvailable={setDisplayedNextStepsIfAvailable}
                        setAgentReviewStatus={setAgentReviewStatus}
                    />
                )}
                <ChatInput
                    app={app}
                    initialContent={''}
                    handleSubmitUserMessage={handleSubmitUserMessage}
                    onCancel={undefined}
                    isEditing={false}
                    contextManager={contextManager}
                    notebookTracker={notebookTracker}
                    agentModeEnabled={agentModeEnabled}
                    agentExecutionStatus={agentExecution.agentExecutionStatus}
                    operatingSystem={operatingSystem}
                    displayOptimizedChatHistoryLength={displayOptimizedChatHistory.length}
                    agentTargetNotebookPanelRef={agentTargetNotebookPanelRef}
                    isSignedUp={isSignedUp}
                />
            </div>
            {agentExecution.agentExecutionStatus !== 'working' && agentExecution.agentExecutionStatus !== 'stopping' && (
                <div className="chat-controls">
                    <div className="chat-controls-left">
                        <ToggleButton
                            leftText="Chat"
                            leftTooltip="Chat mode suggests an edit to the active cell and let's you decide to accept or reject it."
                            rightText="Agent"
                            rightTooltip="Agent mode writes and executes code until it's finished your request."
                            isLeftSelected={!agentModeEnabled}
                            onChange={async (isLeftSelected) => {
                                await startNewChat(); // TODO: delete thread instead of starting new chat
                                setAgentModeEnabled(!isLeftSelected);
                                // Clear agent checkpoint when switching modes
                                setHasCheckpoint(false);
                                setShowRevertQuestionnaire(false);
                                // Focus the chat input directly
                                const chatInput = document.querySelector('.chat-input') as HTMLTextAreaElement;
                                if (chatInput) {
                                    chatInput.focus();
                                }
                            }}
                        />
                        <ModelSelector onConfigChange={(config) => {
                            // Just update the backend
                            void updateModelOnBackend(config.model);
                        }} />
                    </div>
                    <button
                        className="button-base submit-button"
                        onClick={() => {
                            const chatInput = document.querySelector('.chat-input') as HTMLTextAreaElement;
                            if (chatInput && chatInput.value) {
                                // Simulate an Enter keypress
                                // This triggers the existing submission logic in ChatInput.tsx
                                const enterEvent = new KeyboardEvent('keydown', {
                                    key: 'Enter',
                                    code: 'Enter',
                                    keyCode: 13,
                                    which: 13,
                                    bubbles: true,
                                    cancelable: true
                                });
                                chatInput.dispatchEvent(enterEvent);
                            }
                        }}
                    >
                        <span className="submit-text">Submit</span> ⏎
                    </button>
                </div>
            )}
            {(agentExecution.agentExecutionStatus === 'working' || agentExecution.agentExecutionStatus === 'stopping') && (
                <button
                    className="button-base button-red stop-agent-button"
                    onClick={() => void agentExecution.markAgentForStopping('userStop')}
                    disabled={agentExecution.agentExecutionStatus === 'stopping'}
                    data-testid="stop-agent-button"
                >
                    {agentExecution.agentExecutionStatus === 'stopping' ? (
                        <div className="stop-agent-button-content">Stopping<LoadingCircle /> </div>
                    ) : (
                        'Stop Agent'
                    )}
                </button>
            )}
        </div>
    );
};

export default ChatTaskpane;


