/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState } from 'react';
import {
    fetchGithubCopilotLoginStatus,
    getUserKey,
    getChatHistoryThreads,
    getChatHistoryThread
} from '../../../restAPI/RestAPI';

/**
 * Determines if a user should be considered "signed up" based on:
 * 1. Being an enterprise user, OR
 * 2. Having an email address, OR
 * 3. Having existing chat history threads, OR
 * 4. Having a soft signup flag (for cases where email setting failed)
 * 
 * This ensures consistent behavior across all components that need to check
 * if a user should have access to Mito AI features.
 */
const isUserSignedUp = async (): Promise<boolean> => {
    // Check for soft signup flag first (for cases where email setting failed)
    const hasSoftSignup = localStorage.getItem('mito_ai_soft_signup') === 'true';

    try {
        // Enterprise users should never see email signup gating.
        const isEnterprise = await getUserKey('is_enterprise');
        if (isEnterprise === 'True') return true;
    } catch (error) {
        console.error('Failed to check enterprise status:', error);
    }

    try {
        // GitHub Copilot helper: no email gate; Copilot sign-in is handled in the chat UI.
        const copilotStatus = await fetchGithubCopilotLoginStatus();
        if (copilotStatus !== null) {
            return true;
        }
    } catch (error) {
        console.error('Failed to check GitHub Copilot server mode:', error);
    }

    try {
        // Check if user has an email address
        const userEmail = await getUserKey('user_email');
        const hasEmail = userEmail !== "" && userEmail !== undefined;

        if (hasEmail) return true;
    } catch (error) {
        console.error('Failed to check user email:', error);
    }

    try {
        // Check for existing chat history threads
        const chatThreads = await getChatHistoryThreads();
        const hasThreads = chatThreads.length > 0;

        if (!hasThreads) return hasSoftSignup;

        // Verify the first thread has actual content (not just default empty thread)
        const firstThread = await getChatHistoryThread(chatThreads[0]!.thread_id);
        const hasActualChatHistory = firstThread.display_history.length > 0;

        return hasActualChatHistory || hasSoftSignup;
    } catch (error) {
        console.error('Failed to check chat history signup state:', error);
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

