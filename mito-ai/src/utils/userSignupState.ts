/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { getUserKey, getChatHistoryThreads } from '../restAPI/RestAPI';

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
        // Check if user has an email
        const email = await getUserKey('user_email');
        const hasEmail = email !== "" && email !== undefined;

        // If user has email, they're definitely signed up
        if (hasEmail) {
            return {
                isSignedUp: true,
                hasEmail: true,
                hasChatHistory: false // We don't need to check this if they have email
            };
        }

        // If no email, check if they have any chat history threads
        // Existing users will have chat history but no email in some cases
        const threads = await getChatHistoryThreads();
        const hasChatHistory = threads.length > 0;

        return {
            isSignedUp: hasChatHistory,
            hasEmail: false,
            hasChatHistory: hasChatHistory
        };
    } catch (error) {
        console.error('Failed to check user signup state:', error);
        // If there's an error, assume user is not signed up
        return {
            isSignedUp: false,
            hasEmail: false,
            hasChatHistory: false
        };
    }
};

/**
 * Determines if a user should have access to Mito AI features based on:
 * 1. Being signed up (email or chat history), OR
 * 2. Having existing chat messages in the current session
 * 
 * This is used by components that need to consider both signup state
 * and current session activity.
 */
export const shouldEnableMitoAI = async (currentChatHistoryLength: number = 0): Promise<boolean> => {
    const signupState = await checkUserSignupState();
    return signupState.isSignedUp || currentChatHistoryLength > 0;
};
