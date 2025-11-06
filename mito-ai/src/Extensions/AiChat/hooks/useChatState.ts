/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect, useRef, useState } from 'react';
import { ChatHistoryManager } from '../ChatHistoryManager';

export type CodeReviewStatus = 'chatPreview' | 'codeCellPreview' | 'applied';
export type AgentReviewStatus = 'pre-agent-code-review' | 'in-agent-code-review' | 'post-agent-code-review';

/**
 * Hook to manage core chat state in the chat taskpane.
 * 
 * Manages:
 * - chatHistoryManager: The main chat history manager instance
 * - chatHistoryManagerRef: Ref to access the latest chatHistoryManager value (for use in callbacks)
 * - loadingAIResponse: Whether an AI response is currently being loaded
 * - codeReviewStatus: Current status of code review (preview, applied, etc.)
 * - agentReviewStatus: Current status of agent review
 * - nextSteps: Array of suggested next steps from the AI
 * - displayedNextStepsIfAvailable: Whether to display next steps if available
 * 
 * @param initialChatHistoryManager - Initial ChatHistoryManager instance
 * 
 * @returns Object containing all state values and setters
 */
export const useChatState = (
    initialChatHistoryManager: ChatHistoryManager
): {
    chatHistoryManager: ChatHistoryManager;
    chatHistoryManagerRef: React.MutableRefObject<ChatHistoryManager>;
    setChatHistoryManager: (manager: ChatHistoryManager) => void;
    loadingAIResponse: boolean;
    setLoadingAIResponse: (loading: boolean) => void;
    codeReviewStatus: CodeReviewStatus;
    setCodeReviewStatus: (status: CodeReviewStatus) => void;
    agentReviewStatus: AgentReviewStatus;
    setAgentReviewStatus: (status: AgentReviewStatus) => void;
    nextSteps: string[];
    setNextSteps: (steps: string[]) => void;
    displayedNextStepsIfAvailable: boolean;
    setDisplayedNextStepsIfAvailable: (available: boolean) => void;
} => {
    const [chatHistoryManager, setChatHistoryManager] = useState<ChatHistoryManager>(initialChatHistoryManager);
    const chatHistoryManagerRef = useRef<ChatHistoryManager>(chatHistoryManager);

    const [loadingAIResponse, setLoadingAIResponse] = useState<boolean>(false);
    const [codeReviewStatus, setCodeReviewStatus] = useState<CodeReviewStatus>('chatPreview');
    const [agentReviewStatus, setAgentReviewStatus] = useState<AgentReviewStatus>('pre-agent-code-review');
    const [nextSteps, setNextSteps] = useState<string[]>([]);
    const [displayedNextStepsIfAvailable, setDisplayedNextStepsIfAvailable] = useState(true);

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

    return {
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
    };
};

