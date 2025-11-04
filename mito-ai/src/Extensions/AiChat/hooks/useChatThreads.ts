/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useRef, useState } from 'react';
import { UUID } from '@lumino/coreutils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { CompletionWebsocketClient } from '../../../websockets/completions/CompletionsWebsocketClient';
import {
    IChatThreadMetadataItem,
    IFetchHistoryMetadata,
    IDeleteThreadMetadata,
    IFetchHistoryCompletionRequest,
    ICompletionRequest,
    IFetchHistoryReply,
    IFetchThreadsReply,
    IDeleteThreadReply,
    IStartNewChatReply,
    AgentResponse,
} from '../../../websockets/completions/CompletionModels';
import { ChatHistoryManager } from '../ChatHistoryManager';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';
import { IStreamlitPreviewManager } from '../../AppPreview/StreamlitPreviewPlugin';

interface UseChatThreadsProps {
    websocketClient: CompletionWebsocketClient;
    notebookTracker: INotebookTracker;
    contextManager: IContextManager;
    app: JupyterFrontEnd;
    streamlitPreviewManager: IStreamlitPreviewManager;
    chatHistoryManager: ChatHistoryManager;
    chatHistoryManagerRef: React.MutableRefObject<ChatHistoryManager>;
    setChatHistoryManager: (manager: ChatHistoryManager) => void;
    setAgentModeEnabled: (enabled: boolean) => void;
    setNextSteps: (steps: string[]) => void;
    setShowRevertQuestionnaire: (show: boolean) => void;
    setHasCheckpoint: (hasCheckpoint: boolean) => void;
    setAutoScrollFollowMode: (mode: boolean) => void;
    agentReview: {
        clearAgentReviewDiffs: () => void;
    };
    getDefaultChatHistoryManager: (
        notebookTracker: INotebookTracker,
        contextManager: IContextManager,
        app: JupyterFrontEnd,
        streamlitPreviewManager: IStreamlitPreviewManager
    ) => ChatHistoryManager;
}

/**
 * Hook to manage chat thread operations in the chat taskpane.
 * 
 * Manages:
 * - chatThreads: Array of available chat threads
 * - activeThreadIdRef: Ref to the currently active thread ID
 * - fetchChatThreads: Function to fetch all available threads
 * - fetchChatHistoryAndSetActiveThread: Function to load a specific thread's history
 * - deleteThread: Function to delete a thread
 * - startNewChat: Function to start a new chat thread
 */
export const useChatThreads = ({
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
}: UseChatThreadsProps): {
    chatThreads: IChatThreadMetadataItem[];
    activeThreadIdRef: React.MutableRefObject<string>;
    fetchChatThreads: () => Promise<IChatThreadMetadataItem[]>;
    fetchChatHistoryAndSetActiveThread: (threadId: string) => Promise<void>;
    deleteThread: (threadId: string) => Promise<void>;
    startNewChat: () => Promise<ChatHistoryManager>;
} => {
    const [chatThreads, setChatThreads] = useState<IChatThreadMetadataItem[]>([]);
    // The active thread id is originally set by the initializeChatHistory function, which will either set it to 
    // the last active thread or create a new thread if there are no previously existing threads. So that
    // we don't need to handle the undefined case everywhere, we just default to an empty string knowing that
    // it will always be set to a valid thread id before it is used.
    const activeThreadIdRef = useRef<string>('');

    const fetchChatThreads = async (): Promise<IChatThreadMetadataItem[]> => {
        const metadata = {
            promptType: "get_threads" as const
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
        return chatThreadsResponse.threads;
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
        };

        const chatHistoryResponse = await websocketClient.sendMessage<ICompletionRequest, IFetchHistoryReply>(fetchHistoryCompletionRequest);

        // Create a fresh ChatHistoryManager and add the initial messages
        const newChatHistoryManager = getDefaultChatHistoryManager(notebookTracker, contextManager, app, streamlitPreviewManager);

        // Each thread only contains agent or chat messages. For now, we enforce this by clearing the chat 
        // when the user switches mode. When the user reloads a chat, we want to put them back into the same
        // chat mode so that we use the correct system message and preserve this one-type of message invariant.
        let isAgentChat: boolean = false;

        // Add messages to the ChatHistoryManager
        chatHistoryResponse.items.forEach(item => {
            try {
                // If the user sent a message in agent:execution mode, the ai response will be a JSON object which we need to parse. 
                // TODO: We need to save the full metadata in the message_history.json so we don't have to do these hacky workarounds!
                const chatHistoryItem = JSON.parse(item.content as string);
                if (Object.prototype.hasOwnProperty.call(chatHistoryItem, 'type')) {
                    // If it is a structured output with 'type', then it is an AgentResponse and we should handle it as such
                    const agentResponse: AgentResponse = chatHistoryItem;
                    newChatHistoryManager.addAIMessageFromAgentResponse(agentResponse);
                    isAgentChat = true;
                } else {
                    newChatHistoryManager.addChatMessageFromHistory(item);
                    isAgentChat = false;
                }
            } catch {
                newChatHistoryManager.addChatMessageFromHistory(item);
            }
        });

        // Update the state with the new ChatHistoryManager
        setAgentModeEnabled(isAgentChat);
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
        setNextSteps([]);

        // Get rid of the revert questionaire if its open
        setShowRevertQuestionnaire(false);

        // Clear agent checkpoint when starting new chat
        setHasCheckpoint(false);

        // Clear agent review diffs
        agentReview.clearAgentReviewDiffs();

        // Enable follow mode when starting a new chat
        setAutoScrollFollowMode(true);

        // Reset frontend chat history
        const newChatHistoryManager = getDefaultChatHistoryManager(notebookTracker, contextManager, app, streamlitPreviewManager);
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
    };

    return {
        chatThreads,
        activeThreadIdRef,
        fetchChatThreads,
        fetchChatHistoryAndSetActiveThread,
        deleteThread,
        startNewChat,
    };
};

