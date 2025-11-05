/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState } from 'react';
import { getUserKey, getChatHistoryThreads, getChatHistoryThread } from '../../../restAPI/RestAPI';

/**
 * Determines if a user should be considered "signed up" based on:
 * 1. Having an email address, OR
 * 2. Having existing chat history threads, OR
 * 3. Having a soft signup flag (for cases where email setting failed)
 * 
 * This ensures consistent behavior across all components that need to check
 * if a user should have access to Mito AI features.
 */
const isUserSignedUp = async (): Promise<boolean> => {
    try {
        // Check for soft signup flag first (for cases where email setting failed)
        const hasSoftSignup = localStorage.getItem('mito_ai_soft_signup') === 'true';

        // Check if user has an email address
        const userEmail = await getUserKey('user_email');
        const hasEmail = userEmail !== "" && userEmail !== undefined;

        if (hasEmail) return true;

        // Check for existing chat history threads
        const chatThreads = await getChatHistoryThreads();
        const hasThreads = chatThreads.length > 0;

        if (!hasThreads) return hasSoftSignup;

        // Verify the first thread has actual content (not just default empty thread)
        const firstThread = await getChatHistoryThread(chatThreads[0]!.thread_id);
        const hasActualChatHistory = firstThread.display_history.length > 0;

        return hasActualChatHistory || hasSoftSignup;
    } catch (error) {
        console.error('Failed to check user signup state:', error);
        // Even if there's an error, check for soft signup flag
        const hasSoftSignup = localStorage.getItem('mito_ai_soft_signup') === 'true';
        return hasSoftSignup;
    }
};

/**
 * Hook to manage user signup state in the chat taskpane.
 * 
 * Provides:
 * - isSignedUp: Boolean indicating if the user is signed up
 * - refreshUserSignupState: Function to refresh the signup state from the backend
 */
export const useUserSignup = (): {
    isSignedUp: boolean;
    refreshUserSignupState: () => Promise<void>;
} => {
    const [isSignedUp, setIsSignedUp] = useState<boolean>(true);

    const refreshUserSignupState = async (): Promise<void> => {
        const signedUp = await isUserSignedUp();
        setIsSignedUp(signedUp);
    };

    return {
        isSignedUp,
        refreshUserSignupState,
    };
};

