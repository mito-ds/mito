/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState } from 'react';
import { isUserSignedUp } from '../../../utils/userSignupState';

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

