/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { getUserKey, getChatHistoryThreads, getChatHistoryThread } from '../restAPI/RestAPI';

export interface UserSignupState {
    isSignedUp: boolean;
    hasEmail: boolean;
    hasChatHistory: boolean;
}

/**
 * Determines if a user should be considered "signed up" based on:
 * 1. Having an email address, OR
 * 2. Having existing chat history threads
 * 
 * This ensures consistent behavior across all components that need to check
 * if a user should have access to Mito AI features.
 */
export const checkUserSignupState = async (): Promise<UserSignupState> => {
    try {
        // Check if user has an email address
        const userEmail = await getUserKey('user_email');
        const hasEmail = userEmail !== "" && userEmail !== undefined;

        if (hasEmail) {
            return {
                isSignedUp: true,
                hasEmail: true,
                hasChatHistory: false
            };
        }

        // Check for existing chat history threads
        const chatThreads = await getChatHistoryThreads();
        const hasThreads = chatThreads.length > 0;

        if (!hasThreads) {
            return {
                isSignedUp: false,
                hasEmail: false,
                hasChatHistory: false
            };
        }

        // Verify the first thread has actual content (not just default empty thread)
        const firstThread = await getChatHistoryThread(chatThreads[0]!.thread_id);
        const hasActualChatHistory = firstThread.display_history.length > 0;

        return {
            isSignedUp: hasActualChatHistory,
            hasEmail: false,
            hasChatHistory: hasActualChatHistory
        };
    } catch (error) {
        console.error('Failed to check user signup state:', error);
        return {
            isSignedUp: false,
            hasEmail: false,
            hasChatHistory: false
        };
    }
};
