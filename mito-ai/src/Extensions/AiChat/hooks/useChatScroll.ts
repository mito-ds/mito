/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect, useRef, useState } from 'react';
import { scrollToDiv } from '../../../utils/scroll';
import { ChatHistoryManager } from '../ChatHistoryManager';

/**
 * Hook to manage auto-scroll behavior in the chat taskpane.
 * 
 * Tracks whether the chat should automatically scroll to the bottom when new messages arrive.
 * Automatically disables follow mode when the user manually scrolls up, and re-enables it
 * when they scroll back to the bottom.
 * 
 * @param chatHistoryManager - The chat history manager instance to watch for changes
 * 
 * @returns Object containing:
 *   - chatTaskpaneMessagesRef: Ref to attach to the chat messages container in the taskpane
 *   - autoScrollFollowMode: Boolean indicating if auto-scroll is enabled
 *   - autoScrollFollowModeRef: Ref to access the latest autoScrollFollowMode value
 *   - setAutoScrollFollowMode: Function to manually set the auto-scroll mode
 */
export const useChatScroll = (chatHistoryManager: ChatHistoryManager): {
    chatTaskpaneMessagesRef: React.RefObject<HTMLDivElement>;
    autoScrollFollowMode: boolean;
    autoScrollFollowModeRef: React.MutableRefObject<boolean>;
    setAutoScrollFollowMode: (mode: boolean) => void;
} => {
    /* 
        Auto-scroll follow mode: tracks whether we should automatically scroll to bottom
        when new messages arrive. Set to false when user manually scrolls up.
    */
    const [autoScrollFollowMode, setAutoScrollFollowMode] = useState<boolean>(true);
    const autoScrollFollowModeRef = useRef<boolean>(autoScrollFollowMode);
    
    // Ref for the chat messages container in the taskpane
    const chatTaskpaneMessagesRef = useRef<HTMLDivElement>(null);

    // Keep ref in sync with state
    useEffect(() => {
        autoScrollFollowModeRef.current = autoScrollFollowMode;
    }, [autoScrollFollowMode]);

    // Scroll to bottom whenever chat history updates, but only if in follow mode
    useEffect(() => {
        if (autoScrollFollowMode) {
            scrollToDiv(chatTaskpaneMessagesRef);
        }
    }, [chatHistoryManager.getDisplayOptimizedHistory().length, chatHistoryManager, autoScrollFollowMode]);

    // Add scroll event handler to detect manual scrolling
    useEffect(() => {
        const chatContainer = chatTaskpaneMessagesRef.current;
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

    return {
        chatTaskpaneMessagesRef,
        autoScrollFollowMode,
        autoScrollFollowModeRef,
        setAutoScrollFollowMode,
    };
};

