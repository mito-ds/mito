/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// External libraries
import { Compartment, StateEffect } from '@codemirror/state';
import OpenAI from "openai";
import React, { useEffect, useRef, useState } from 'react';

// JupyterLab imports
import { JupyterFrontEnd } from '@jupyterlab/application';
import { CodeCell } from '@jupyterlab/cells';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
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
import LoadingDots from '../../components/LoadingDots';
import { DEFAULT_MODEL } from '../../components/ModelSelector';
import ModelSelector from '../../components/ModelSelector';
import NextStepsPills from '../../components/NextStepsPills';
import TextAndIconButton from '../../components/TextAndIconButton';
import ToggleButton from '../../components/ToggleButton';

// Internal imports - Icons
import { OpenIndicatorLabIcon } from '../../icons';
import MitoLogo from '../../icons/MitoLogo';
import UndoIcon from '../../icons/UndoIcon';

// Internal imports - Utils
import { acceptAndRunCellUpdate, retryIfExecutionError } from '../../utils/agentActions';
import { checkForBlacklistedWords } from '../../utils/blacklistedWords';
import { createCheckpoint, restoreCheckpoint } from '../../utils/checkpoint';
import { processChatHistoryForErrorGrouping, GroupedErrorMessages } from '../../utils/chatHistory';
import { getCodeDiffsAndUnifiedCodeString, UnifiedDiffLine } from '../../utils/codeDiff';
import {
    getActiveCellID,
    getActiveCellOutput,
    getCellByID,
    getCellCodeByID,
    highlightCodeCell,
    scrollToCell,
    setActiveCellByID,
    writeCodeToCellByID,
} from '../../utils/notebook';
import { scrollToDiv } from '../../utils/scroll';
import { getCodeBlockFromMessage, removeMarkdownCodeFormatting } from '../../utils/strings';
import { OperatingSystem } from '../../utils/user';
import { waitForNotebookReady } from '../../utils/waitForNotebookReady';

// Internal imports - Websockets
import type { CompletionWebsocketClient } from '../../websockets/completions/CompletionsWebsocketClient';
import {
    IChatThreadMetadataItem,
    IChatMessageMetadata,
    IGetThreadsMetadata,
    IFetchHistoryMetadata,
    IDeleteThreadMetadata,
    ICompletionReply,
    IDeleteThreadReply,
    IFetchHistoryReply,
    IFetchThreadsReply,
    IStartNewChatReply,
    ICompletionRequest,
    ICodeExplainCompletionRequest,
    IChatCompletionRequest,
    ISmartDebugCompletionRequest,
    IFetchHistoryCompletionRequest,
    IAgentAutoErrorFixupCompletionRequest,
    IAgentExecutionCompletionRequest,
    AgentResponse,
    ICompletionStreamChunk
} from '../../websockets/completions/CompletionModels';

// Internal imports - Extensions
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import { COMMAND_MITO_AI_SETTINGS } from '../SettingsManager/SettingsManagerPlugin';

// Internal imports - Chat components
import CTACarousel from './CTACarousel';
import { codeDiffStripesExtension } from './CodeDiffDisplay';
import { getFirstMessageFromCookie } from './FirstMessage';
import ChatInput from './ChatMessage/ChatInput';
import ChatMessage from './ChatMessage/ChatMessage';
import RevertQuestionnaire from './ChatMessage/RevertQuestionnaire';
import ScrollableSuggestions from './ChatMessage/ScrollableSuggestions';
import { ChatHistoryManager, IDisplayOptimizedChatItem, PromptType } from './ChatHistoryManager';

// Styles
import '../../../style/button.css';
import '../../../style/ChatTaskpane.css';
import '../../../style/TextButton.css';
import { getBase64EncodedCellOutput } from './utils';

const AGENT_EXECUTION_DEPTH_LIMIT = 20

const getDefaultChatHistoryManager = (notebookTracker: INotebookTracker, contextManager: IContextManager): ChatHistoryManager => {
    const chatHistoryManager = new ChatHistoryManager(contextManager, notebookTracker)
    return chatHistoryManager
}

interface IChatTaskpaneProps {
    notebookTracker: INotebookTracker
    renderMimeRegistry: IRenderMimeRegistry
    contextManager: IContextManager
    app: JupyterFrontEnd
    operatingSystem: OperatingSystem
    websocketClient: CompletionWebsocketClient
}

interface ICellStateBeforeDiff {
    codeCellID: string
    code: string
}

export type CodeReviewStatus = 'chatPreview' | 'codeCellPreview' | 'applied'
export type AgentExecutionStatus = 'working' | 'stopping' | 'idle'

const ChatTaskpane: React.FC<IChatTaskpaneProps> = ({
    notebookTracker,
    renderMimeRegistry,
    contextManager,
    app,
    operatingSystem,
    websocketClient,
}) => {

    const [chatHistoryManager, setChatHistoryManager] = useState<ChatHistoryManager>(() => getDefaultChatHistoryManager(notebookTracker, contextManager));
    const chatHistoryManagerRef = useRef<ChatHistoryManager>(chatHistoryManager);

    const [loadingAIResponse, setLoadingAIResponse] = useState<boolean>(false)

    // Store the original cell before diff so that we can revert to it if the user rejects the AI's code
    const cellStateBeforeDiff = useRef<ICellStateBeforeDiff | undefined>(undefined)

    // Three possible states:
    // 1. chatPreview: state where the user has not yet pressed the apply button.
    // 2. codeCellPreview: state where the user is seeing the code diffs and deciding how they want to respond.
    // 3. applied: state where the user has applied the code to the code cell
    const [codeReviewStatus, setCodeReviewStatus] = useState<CodeReviewStatus>('chatPreview')

    // Add this ref for the chat messages container
    const chatMessagesRef = useRef<HTMLDivElement>(null);

    /* 
        Keep track of agent mode enabled state and use keep a ref in sync with it 
        so that we can access the most up-to-date value during a function's execution.
        Without it, we would always use the initial value of agentModeEnabled.
    */
    const [agentModeEnabled, setAgentModeEnabled] = useState<boolean>(true)
    const agentModeEnabledRef = useRef<boolean>(agentModeEnabled);
    useEffect(() => {
        // Update the ref whenever agentModeEnabled state changes
        agentModeEnabledRef.current = agentModeEnabled;
    }, [agentModeEnabled]);

    /* 
        Auto-scroll follow mode: tracks whether we should automatically scroll to bottom
        when new messages arrive. Set to false when user manually scrolls up.
    */
    const [autoScrollFollowMode, setAutoScrollFollowMode] = useState<boolean>(true);
    const autoScrollFollowModeRef = useRef<boolean>(autoScrollFollowMode);
    useEffect(() => {
        autoScrollFollowModeRef.current = autoScrollFollowMode;
    }, [autoScrollFollowMode]);

    const [chatThreads, setChatThreads] = useState<IChatThreadMetadataItem[]>([]);
    // The active thread id is originally set by the initializeChatHistory function, which will either set it to 
    // the last active thread or create a new thread if there are no previously existing threads. So that
    // we don't need to handle the undefined case everywhere, we just default to an empty string knowing that
    // it will always be set to a valid thread id before it is used.
    const activeThreadIdRef = useRef<string>('');

    /* 
        Three possible states:
        1. working: the agent is working on the task
        2. stopping: the agent is stopping after it has received ai response it is waiting on
        3. idle: the agent is idle
    */
    const [agentExecutionStatus, setAgentExecutionStatus] = useState<AgentExecutionStatus>('idle')

    // We use a ref to always access the most up-to-date value during a function's execution. Refs immediately reflect changes, 
    // unlike state variables, which are captured at the beginning of a function and may not reflect updates made during execution.
    const shouldContinueAgentExecution = useRef<boolean>(true);

    const streamingContentRef = useRef<string>('');
    const streamHandlerRef = useRef<((sender: CompletionWebsocketClient, chunk: ICompletionStreamChunk) => void) | null>(null);

    // State for managing next steps from responses
    // If the user hides the next steps, we keep them hidden until they re-open them
    const [nextSteps, setNextSteps] = useState<string[]>([]);
    const [displayedNextStepsIfAvailable, setDisplayedNextStepsIfAvailable] = useState(true);

    // Track if checkpoint exists for UI updates
    const [hasCheckpoint, setHasCheckpoint] = useState<boolean>(false);

    // Track if revert questionnaire should be shown
    const [showRevertQuestionnaire, setShowRevertQuestionnaire] = useState<boolean>(false);

    const updateModelOnBackend = async (model: string): Promise<void> => {
        try {
            await websocketClient.sendMessage({
                type: "update_model_config",
                message_id: UUID.uuid4(),
                metadata: {
                    promptType: "update_model_config",
                    model: model
                },
                stream: false
            });

            console.log('Model configuration updated on backend:', model);
        } catch (error) {
            console.error('Failed to update model configuration on backend:', error);
        }
    };

    const fetchChatThreads = async (): Promise<void> => {
        const metadata: IGetThreadsMetadata = {
            promptType: "get_threads"
        };

        const chatThreadsResponse = await websocketClient.sendMessage<
            ICompletionRequest,
            IFetchThreadsReply
        >({
            type: "get_threads",
            message_id: UUID.uuid4(),
            metadata: metadata,
            stream: false
        });

        setChatThreads(chatThreadsResponse.threads);
    };

    const fetchChatHistoryAndSetActiveThread = async (threadId: string): Promise<void> => {
        const metadata: IFetchHistoryMetadata = {
            promptType: "fetch_history",
            thread_id: threadId
        };

        const fetchHistoryCompletionRequest: IFetchHistoryCompletionRequest = {
            type: 'fetch_history',
            message_id: UUID.uuid4(),
            metadata: metadata,
            stream: false
        }

        const chatHistoryResponse = await websocketClient.sendMessage<ICompletionRequest, IFetchHistoryReply>(fetchHistoryCompletionRequest);

        // Create a fresh ChatHistoryManager and add the initial messages
        const newChatHistoryManager = getDefaultChatHistoryManager(notebookTracker, contextManager);

        // Each thread only contains agent or chat messages. For now, we enforce this by clearing the chat 
        // when the user switches mode. When the user reloads a chat, we want to put them back into the same
        // chat mode so that we use the correct system message and preserve this one-type of message invariant.
        let isAgentChat: boolean = false

        // Add messages to the ChatHistoryManager
        chatHistoryResponse.items.forEach(item => {
            try {
                // If the user sent a message in agent:execution mode, the ai response will be a JSON object which we need to parse. 
                // TODO: We need to save the full metadata in the message_history.json so we don't have to do these hacky workarounds!
                const chatHistoryItem = JSON.parse(item.content as string);
                if (Object.prototype.hasOwnProperty.call(chatHistoryItem, 'type')) {
                    // If it is a structured output with 'type', then it is an AgentResponse and we should handle it as such
                    const agentResponse: AgentResponse = chatHistoryItem
                    newChatHistoryManager.addAIMessageFromAgentResponse(agentResponse)
                    isAgentChat = true
                } else {
                    newChatHistoryManager.addChatMessageFromHistory(item);
                    isAgentChat = false
                }
            } catch {
                newChatHistoryManager.addChatMessageFromHistory(item);
            }
        });

        // Update the state with the new ChatHistoryManager
        setAgentModeEnabled(isAgentChat)
        setChatHistoryManager(newChatHistoryManager);
        activeThreadIdRef.current = threadId;
    };

    const deleteThread = async (threadId: string): Promise<void> => {
        const metadata: IDeleteThreadMetadata = {
            promptType: "delete_thread",
            thread_id: threadId
        };

        const response = await websocketClient.sendMessage<ICompletionRequest, IDeleteThreadReply>({
            type: "delete_thread",
            message_id: UUID.uuid4(),
            metadata: metadata,
            stream: false
        });

        if (response.success) {
            const updatedThreads = chatThreads.filter(thread => thread.thread_id !== threadId);
            setChatThreads(updatedThreads);
            if (activeThreadIdRef.current === threadId) {
                if (updatedThreads.length > 0) {
                    const latestThread = updatedThreads[0]!;
                    await fetchChatHistoryAndSetActiveThread(latestThread.thread_id);
                } else {
                    await startNewChat();
                }
            }
        }
    };

    const startNewChat = async (): Promise<ChatHistoryManager> => {

        // If current thread is empty and we already have an active thread id, do not create a new thread.
        if (chatHistoryManagerRef.current.getDisplayOptimizedHistory().length === 0 && activeThreadIdRef.current !== '') {
            return chatHistoryManager;
        }

        // Clear next steps when starting a new chat
        setNextSteps([])

        // Get rid of the revert questionaire if its open
        setShowRevertQuestionnaire(false);

        // Clear agent checkpoint when starting new chat
        setHasCheckpoint(false)

        // Enable follow mode when starting a new chat
        setAutoScrollFollowMode(true);

        // Reset frontend chat history
        const newChatHistoryManager = getDefaultChatHistoryManager(notebookTracker, contextManager);
        setChatHistoryManager(newChatHistoryManager);

        // Notify the backend to request a new chat thread and get its ID
        try {
            const response = await websocketClient.sendMessage<ICompletionRequest, IStartNewChatReply>({
                type: 'start_new_chat',
                message_id: UUID.uuid4(),
                metadata: {
                    promptType: 'start_new_chat'
                },
                stream: false,
            });

            // Set the new thread ID as active
            activeThreadIdRef.current = response.thread_id;
        } catch (error) {
            console.error('Error starting new chat:', error);
        }

        return newChatHistoryManager;
    }

    useEffect(() => {
        const initializeChatHistory = async (): Promise<void> => {
            try {
                // Check for saved model preference in localStorage
                const storedConfig = localStorage.getItem('llmModelConfig');
                let initialModel = DEFAULT_MODEL;
                if (storedConfig) {
                    try {
                        const parsedConfig = JSON.parse(storedConfig);
                        initialModel = parsedConfig.model || DEFAULT_MODEL;
                    } catch (e) {
                        console.error('Failed to parse stored LLM config', e);
                    }
                }

                // Set the model on backend when the taskpane is opened
                void updateModelOnBackend(initialModel);

                // 1. Fetch available chat threads.
                const chatThreadsResponse = await websocketClient.sendMessage<ICompletionRequest, IFetchThreadsReply>({
                    type: "get_threads",
                    message_id: UUID.uuid4(),
                    metadata: {
                        promptType: "get_threads"
                    },
                    stream: false
                });

                setChatThreads(chatThreadsResponse.threads);

                // 2. If threads exist, load the latest thread; otherwise, start a new chat.
                if (chatThreadsResponse.threads.length > 0) {
                    const latestThread = chatThreadsResponse.threads[0]!;
                    await fetchChatHistoryAndSetActiveThread(latestThread.thread_id);
                } else {
                    await startNewChat();
                }

                const firstMessage = getFirstMessageFromCookie();
                if (firstMessage) {
                    await waitForNotebookReady(notebookTracker);
                    await startAgentExecution(firstMessage);
                }

            } catch (error: unknown) {
                const newChatHistoryManager = getDefaultChatHistoryManager(
                    notebookTracker,
                    contextManager
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

        void initializeChatHistory();

    }, [websocketClient]);

    useEffect(() => {
        /* 
            Why we use a ref (chatHistoryManagerRef) instead of directly accessing the state (chatHistoryManager):

            The reason we use a ref here is because the function `applyLatestCode` is registered once 
            when the component mounts via `app.commands.addCommand`. If we directly used `chatHistoryManager`
            in the command's execute function, it would "freeze" the state at the time of the registration 
            and wouldn't update as the state changes over time.

            React's state (`useState`) is asynchronous, and the registered command won't automatically pick up the 
            updated state unless the command is re-registered every time the state changes, which would require 
            unregistering and re-registering the command, causing unnecessary complexity.

            By using a ref (`chatHistoryManagerRef`), we are able to keep a persistent reference to the 
            latest version of `chatHistoryManager`, which is updated in this effect whenever the state 
            changes. This allows us to always access the most recent state of `chatHistoryManager` in the 
            `applyLatestCode` function, without needing to re-register the command or cause unnecessary re-renders.

            We still use `useState` for `chatHistoryManager` so that we can trigger a re-render of the chat
            when the state changes.
        */
        chatHistoryManagerRef.current = chatHistoryManager;

    }, [chatHistoryManager]);

    // Scroll to bottom whenever chat history updates, but only if in follow mode
    useEffect(() => {
        if (autoScrollFollowMode) {
            scrollToDiv(chatMessagesRef);
        }
    }, [chatHistoryManager.getDisplayOptimizedHistory().length, chatHistoryManager, autoScrollFollowMode]);

    // Add scroll event handler to detect manual scrolling
    useEffect(() => {
        const chatContainer = chatMessagesRef.current;
        if (!chatContainer) return;

        const handleScroll = (): void => {
            const { scrollTop, scrollHeight, clientHeight } = chatContainer;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold

            // If user is not at bottom and we're in follow mode, break out of follow mode
            if (!isAtBottom && autoScrollFollowModeRef.current) {
                setAutoScrollFollowMode(false);
            }
            // If user scrolls back to bottom, re-enter follow mode
            else if (isAtBottom && !autoScrollFollowModeRef.current) {
                setAutoScrollFollowMode(true);
            }
        };

        chatContainer.addEventListener('scroll', handleScroll);
        return () => chatContainer.removeEventListener('scroll', handleScroll);
    }, []);

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
        // Step 0: reset the state for a new message
        resetForNewMessage()

        // Enable follow mode when sending agent debug message (same behavior as other modes)
        setAutoScrollFollowMode(true);

        // Step 1: Create message metadata
        const newChatHistoryManager = getDuplicateChatHistoryManager()
        const agentSmartDebugMessage = newChatHistoryManager.addAgentSmartDebugMessage(activeThreadIdRef.current, errorMessage)
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

        // Step 1: Add the user's message to the chat history
        const newChatHistoryManager = getDuplicateChatHistoryManager()

        if (messageIndex !== undefined) {
            // Drop all of the messages starting at the message index
            newChatHistoryManager.dropMessagesStartingAtIndex(messageIndex)
        }

        const agentExecutionMetadata = newChatHistoryManager.addAgentExecutionMessage(activeThreadIdRef.current, input, additionalContext)
        if (messageIndex !== undefined) {
            agentExecutionMetadata.index = messageIndex
        }

        agentExecutionMetadata.base64EncodedActiveCellOutput = await getBase64EncodedCellOutput(notebookTracker, sendCellIDOutput)

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

    const handleUpdateMessage = async (
        messageIndex: number,
        newContent: string,
        additionalContext?: Array<{type: string, value: string}>
    ): Promise<void> => {

        // Then send the new message to replace it
        if (agentModeEnabled) {
            await startAgentExecution(newContent, messageIndex, additionalContext)
        } else {
            await sendChatInputMessage(newContent, messageIndex, additionalContext)
        }
    };

    const _sendMessageAndSaveResponse = async (
        completionRequest: ICompletionRequest, newChatHistoryManager: ChatHistoryManager
    ): Promise<boolean> => {
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
                const aiResponse = await websocketClient.sendMessage<ICompletionRequest, ICompletionReply>(completionRequest);

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

    const markAgentForStopping = (): void => {
        // Signal that the agent should stop after current task
        shouldContinueAgentExecution.current = false;
        // Update UI to show stopping state
        setAgentExecutionStatus('stopping');
    }

    const finalizeAgentStop = (): void => {
        // Notify user that agent has been stopped
        shouldContinueAgentExecution.current = false;
        const newChatHistoryManager = getDuplicateChatHistoryManager();
        addAIMessageFromResponseAndUpdateState(
            "Agent execution stopped. You can continue the conversation or start a new one.",
            'chat',
            newChatHistoryManager
        );
        // Reset agent to idle state
        setAgentExecutionStatus('idle');
    }

    const startAgentExecution = async (input: string, messageIndex?: number, additionalContext?: Array<{type: string, value: string}>): Promise<void> => {
        await createCheckpoint(app, setHasCheckpoint);
        setAgentExecutionStatus('working')

        // Enable follow mode when user starts agent execution
        setAutoScrollFollowMode(true);

        // Reset the execution flag at the start of a new plan
        shouldContinueAgentExecution.current = true;

        let isAgentFinished = false
        let agentExecutionDepth = 1
        let sendCellIDOutput: string | undefined = undefined

        // Loop through each message in the plan and send it to the AI
        while (!isAgentFinished && agentExecutionDepth <= AGENT_EXECUTION_DEPTH_LIMIT) {
            // Check if we should continue execution
            if (!shouldContinueAgentExecution.current) {
                finalizeAgentStop()
                break;
            }

            // Only the first message sent to the Agent should contain the user's input.
            // All other messages only contain updated information about the state of the notebook.
            if (agentExecutionDepth === 1) {
                await sendAgentExecutionMessage(input, messageIndex, undefined, additionalContext)
            } else {
                await sendAgentExecutionMessage('', undefined, sendCellIDOutput)
                // Reset flag back to false until the agent requests the active cell output again
                sendCellIDOutput = undefined
            }

            // Iterate the agent execution depth
            agentExecutionDepth++

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
                            chatHistoryManager
                        );
                        finalizeAgentStop()
                        break;
                    }
                }
            }

            const agentResponse = aiDisplayOptimizedChatItem?.agentResponse

            if (agentResponse === undefined) {
                // If the agent response is undefined, we need to send a message to the agent
                isAgentFinished = true
                break;
            }

            if (agentResponse.type === 'finished_task') {
                // If the agent told us that it is finished, we can stop
                isAgentFinished = true
                break;
            }

            if (agentResponse.type === 'cell_update' && (agentResponse.cell_update === undefined || agentResponse.cell_update === null)) {
                // If the agent's response is not formatted correctly, stop. This is for typechecking mostly
                isAgentFinished = true
                break;
            }

            if (agentResponse.type === 'cell_update' && agentResponse.cell_update) {
                // Run the code and handle any errors
                await acceptAndRunCellUpdate(
                    agentResponse.cell_update,
                    notebookTracker,
                    app,
                    previewAICodeToActiveCell,
                    acceptAICode
                )

                const status = await retryIfExecutionError(
                    notebookTracker,
                    app,
                    getDuplicateChatHistoryManager,
                    addAIMessageFromResponseAndUpdateState,
                    sendAgentSmartDebugMessage,
                    previewAICodeToActiveCell,
                    acceptAICode,
                    shouldContinueAgentExecution,
                    finalizeAgentStop,
                    chatHistoryManagerRef
                )

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
                        chatHistoryManager
                    )
                    break;
                }
            }

            if (agentResponse.type === 'get_cell_output' && agentResponse.get_cell_output_cell_id !== null && agentResponse.get_cell_output_cell_id !== undefined) {
                // Mark that we should send the cell output to the agent 
                // in the next loop iteration
                sendCellIDOutput = agentResponse.get_cell_output_cell_id
            }
        }

        if (agentExecutionDepth > AGENT_EXECUTION_DEPTH_LIMIT) {
            addAIMessageFromResponseAndUpdateState(
                "Since I've been working for a while now, give my work a review and then tell me how to continue.",
                'agent:execution',
                chatHistoryManager
            )
        }

        setAgentExecutionStatus('idle')
    }

    const updateCodeDiffStripes = (aiMessage: OpenAI.ChatCompletionMessageParam | undefined, updateCellID: string): void => {
        if (!aiMessage) {
            return
        }

        const updateCellCode = getCellCodeByID(notebookTracker, updateCellID)

        if (updateCellID === undefined || updateCellCode === undefined) {
            return
        }

        // Extract the code from the AI's message and then calculate the code diffs
        const aiGeneratedCode = getCodeBlockFromMessage(aiMessage);
        const aiGeneratedCodeCleaned = removeMarkdownCodeFormatting(aiGeneratedCode || '');
        const { unifiedCodeString, unifiedDiffs } = getCodeDiffsAndUnifiedCodeString(updateCellCode, aiGeneratedCodeCleaned)


        // Store the code cell ID where we write the code diffs so that we can
        // accept or reject the code diffs to the correct cell
        cellStateBeforeDiff.current = { codeCellID: updateCellID, code: updateCellCode }

        // Temporarily write the unified code string to the active cell so we can display
        // the code diffs to the user
        writeCodeToCellByID(notebookTracker, unifiedCodeString, updateCellID)
        updateCodeCellsExtensions(unifiedDiffs)

        // Briefly highlight the code cell to draw the user's attention to it
        highlightCodeCell(notebookTracker, updateCellID)
    }

    const displayOptimizedChatHistory = chatHistoryManager.getDisplayOptimizedHistory()

    const previewAICodeToActiveCell = (): void => {
        setCodeReviewStatus('codeCellPreview')

        const activeCellID = getActiveCellID(notebookTracker)
        const lastAIDisplayMessage = chatHistoryManagerRef.current.getLastAIDisplayOptimizedChatItem()

        if (activeCellID === undefined || lastAIDisplayMessage === undefined) {
            return
        }

        scrollToCell(notebookTracker, activeCellID, undefined, 'end')
        updateCodeDiffStripes(lastAIDisplayMessage.message, activeCellID)
        updateCellToolbarButtons()
    }

    const acceptAICode = (): void => {
        const latestChatHistoryManager = chatHistoryManagerRef.current;
        const lastAIMessage = latestChatHistoryManager.getLastAIDisplayOptimizedChatItem()

        if (!lastAIMessage || !cellStateBeforeDiff.current) {
            return
        }

        const aiGeneratedCode = getCodeBlockFromMessage(lastAIMessage.message);
        if (!aiGeneratedCode) {
            return
        }

        setCodeReviewStatus('applied')

        const targetCellID = cellStateBeforeDiff.current.codeCellID
        // Write to the cell that has the code diffs
        writeCodeToCellAndTurnOffDiffs(aiGeneratedCode, targetCellID)

        // Focus on the active cell after the code is written
        const targetCell = getCellByID(notebookTracker, targetCellID)
        if (targetCell) {
            // Make the target cell the active cell
            setActiveCellByID(notebookTracker, targetCellID)
            // Focus on the active cell
            targetCell.activate();
        }
    }

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

    const rejectAICode = (): void => {
        if (cellStateBeforeDiff.current === undefined) {
            return
        }

        setCodeReviewStatus('chatPreview')

        writeCodeToCellAndTurnOffDiffs(cellStateBeforeDiff.current.code, cellStateBeforeDiff.current.codeCellID)
    }

    const writeCodeToCellAndTurnOffDiffs = (code: string, codeCellID: string | undefined): void => {
        updateCodeCellsExtensions(undefined)
        cellStateBeforeDiff.current = undefined

        if (codeCellID !== undefined) {
            writeCodeToCellByID(notebookTracker, code, codeCellID)
            updateCellToolbarButtons()
        }
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
                    // Make sure we're in agent mode 
                    console.log('Setting agent mode to true')

                    // If its not already in agent mode, start a new chat in agent mode
                    if (!agentModeEnabledRef.current) {
                        await startNewChat();
                        setAgentModeEnabled(true);
                    }

                    // Wait for the next tick to ensure state update is processed
                    await new Promise(resolve => setTimeout(resolve, 0));

                    await startAgentExecution(args.input.toString())
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
            execute: () => { acceptAICode() },
            // We use the cellStateBeforeDiff because it contains the code cell ID that we want to write to
            // and it will only be set when the codeReviewStatus is 'codeCellPreview'
            isVisible: () => {
                try {
                    return notebookTracker.activeCell?.model.id === cellStateBeforeDiff.current?.codeCellID
                } catch (error) {
                    console.error('Error checking if code cell toolbar accept code is visible', error)
                    return false;
                }
            }
        });

        app.commands.addCommand(COMMAND_MITO_AI_CELL_TOOLBAR_REJECT_CODE, {
            label: `Reject ${operatingSystem === 'mac' ? '⌘U' : 'Ctrl+U'}`,
            className: 'text-button-mito-ai button-base button-red',
            caption: 'Reject Code',
            execute: () => { rejectAICode() },
            isVisible: () => {
                try {
                    return notebookTracker.activeCell?.model.id === cellStateBeforeDiff.current?.codeCellID
                } catch (error) {
                    console.error('Error checking if code cell toolbar reject code is visible', error)
                    return false;
                }
            }
        });
    }, []);

    useEffect(() => {
        // Register keyboard shortcuts 
        const accelYDisposable = app.commands.addKeyBinding({
            command: codeReviewStatus === 'chatPreview' ?
                COMMAND_MITO_AI_PREVIEW_LATEST_CODE :
                COMMAND_MITO_AI_APPLY_LATEST_CODE,
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
    }, [codeReviewStatus]);

    const updateCellToolbarButtons = (): void => {
        // Tell Jupyter to re-evaluate if the toolbar buttons should be visible.
        // Without this, the user needs to take some action, like switching to a different cell 
        // and then switching back in order for the Jupyter to re-evaluate if it should
        // show the toolbar buttons.
        app.commands.notifyCommandChanged(COMMAND_MITO_AI_CELL_TOOLBAR_ACCEPT_CODE);
        app.commands.notifyCommandChanged(COMMAND_MITO_AI_CELL_TOOLBAR_REJECT_CODE);
    }
    
    const codeDiffStripesCompartments = React.useRef(new Map<string, Compartment>());

    // Function to update the extensions of code cells
    const updateCodeCellsExtensions = (unifiedDiffLines: UnifiedDiffLine[] | undefined): void => {
        const notebook = notebookTracker.currentWidget?.content;
        if (!notebook) {
            return;
        }

        const activeCellIndex = notebook.activeCellIndex

        notebook.widgets.forEach((cell, index) => {
            if (cell.model.type === 'code') {

                const isActiveCodeCell = activeCellIndex === index

                // TODO: Instead of casting, we should rely on the type system to make 
                // sure we're using the correct types!
                const codeCell = cell as CodeCell;

                const cmEditor = codeCell.editor as CodeMirrorEditor;
                const editorView = cmEditor?.editor;

                if (editorView) {
                    const cellId = codeCell.model.id;
                    let compartment = codeDiffStripesCompartments.current.get(cellId);

                    if (!compartment) {
                        // Create a new compartment and store it
                        compartment = new Compartment();
                        codeDiffStripesCompartments.current.set(cellId, compartment);

                        // Apply the initial configuration
                        editorView.dispatch({
                            effects: StateEffect.appendConfig.of(
                                compartment.of(unifiedDiffLines !== undefined && isActiveCodeCell ? codeDiffStripesExtension({ unifiedDiffLines: unifiedDiffLines }) : [])
                            ),
                        });
                    } else {
                        // Reconfigure the compartment
                        editorView.dispatch({
                            effects: compartment.reconfigure(
                                unifiedDiffLines !== undefined && isActiveCodeCell ? codeDiffStripesExtension({ unifiedDiffLines: unifiedDiffLines }) : []
                            ),
                        });
                    }
                } else {
                    console.log('Mito AI: editor view not found when applying code diff stripes')
                }
            }
        });
    };

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
        <div className="chat-taskpane">
            <div className="chat-taskpane-header">
                <div className="chat-taskpane-header-left">
                    <IconButton
                        icon={<settingsIcon.react />}
                        title="Mito AI Settings"
                        onClick={() => {
                            void app.commands.execute(COMMAND_MITO_AI_SETTINGS);
                        }}
                    />
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
            <div className="chat-messages" ref={chatMessagesRef}>
                {displayOptimizedChatHistory.length === 0 &&
                    <div className="chat-empty-message">
                        <div style={{ margin: '0 auto 8px', display: 'block', textAlign: 'center' }}>
                            <MitoLogo width="60" height="30" />
                        </div>
                        <span style={{ display: 'block', textAlign: 'center', fontWeight: 'bold', fontSize: '20px', marginBottom: '15px' }}>Data Copilot</span>
                        <CTACarousel app={app} />
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
                                onUpdateMessage={handleUpdateMessage}
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
                {/* Agent restore button - shows after agent completes and when agent checkpoint exists */}
                {hasCheckpoint &&
                    agentModeEnabled &&
                    agentExecutionStatus === 'idle' &&
                    displayOptimizedChatHistory.length > 0 && (
                        <div className='message message-assistant-chat'>
                            <TextAndIconButton
                                text="Revert changes"
                                icon={UndoIcon}
                                title="Revert changes"
                                onClick={() => {
                                    void restoreCheckpoint(app, notebookTracker, setHasCheckpoint)
                                    setDisplayedNextStepsIfAvailable(false)
                                    setHasCheckpoint(false)
                                    setShowRevertQuestionnaire(true)
                                    scrollToDiv(chatMessagesRef);
                                }}
                                variant="gray"
                                width="fit-contents"
                                iconPosition="left"
                            />
                            <p className="text-muted text-sm">
                                Undo the most recent changes made by the agent
                            </p>
                        </div>
                    )}
                {/* Revert questionnaire - shows when user clicks revert button */}
                {showRevertQuestionnaire && (
                    <RevertQuestionnaire 
                        onDestroy={() => setShowRevertQuestionnaire(false)} 
                        getDuplicateChatHistoryManager={getDuplicateChatHistoryManager}
                        setChatHistoryManager={setChatHistoryManager}
                    />
                )}
            </div>
            {displayOptimizedChatHistory.length === 0 && (
                <div className="suggestions-container">
                    <ScrollableSuggestions
                        onSelectSuggestion={(prompt) => {
                            if (agentModeEnabled) {
                                void startAgentExecution(prompt);
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
                        onSelectNextStep={agentModeEnabled ? startAgentExecution : sendChatInputMessage}
                        displayedNextStepsIfAvailable={displayedNextStepsIfAvailable}
                        setDisplayedNextStepsIfAvailable={setDisplayedNextStepsIfAvailable}
                    />
                )}
                <ChatInput
                    app={app}
                    initialContent={''}
                    placeholder={
                        agentExecutionStatus === 'working' ? 'Agent is working...' :
                            agentExecutionStatus === 'stopping' ? 'Agent is stopping...' :
                                agentModeEnabled ? 'Ask agent to do anything' :
                                    displayOptimizedChatHistory.length < 2 ? `Ask question (${operatingSystem === 'mac' ? '⌘' : 'Ctrl'}E), @ to mention`
                                        : `Ask followup (${operatingSystem === 'mac' ? '⌘' : 'Ctrl'}E), @ to mention`
                    }
                    onSave={agentModeEnabled ? startAgentExecution : sendChatInputMessage}
                    onCancel={undefined}
                    isEditing={false}
                    contextManager={contextManager}
                    notebookTracker={notebookTracker}
                    agentModeEnabled={agentModeEnabled}
                    agentExecutionStatus={agentExecutionStatus}
                />
            </div>
            {agentExecutionStatus !== 'working' && agentExecutionStatus !== 'stopping' && (
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
            {(agentExecutionStatus === 'working' || agentExecutionStatus === 'stopping') && (
                <button
                    className="button-base button-red stop-agent-button"
                    onClick={markAgentForStopping}
                    disabled={agentExecutionStatus === 'stopping'}
                    data-testid="stop-agent-button"
                >
                    {agentExecutionStatus === 'stopping' ? (
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
