/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import { configureAmplify } from './aws-config';

// Ensure Amplify is configured before any auth operations
configureAmplify();

/**
 * Get JWT token from cookies
 */

export const getJWTToken = async (): Promise<string> => {
    try {
        const session = await fetchAuthSession();
        const accessToken = session.tokens?.accessToken?.toString();
        return accessToken || '';
    } catch (error) {
        console.error('Error getting JWT token:', error);
        return '';
    }
};


/**
 * Get authentication headers for API requests
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await getJWTToken();
    if (token) {
        return {
            'Authorization': `Bearer ${token}`
        };
    }
    return {};
};

/**
 * Logout user and clear all AWS Amplify/Cognito localStorage items
 */
export const logoutAndClearJWTTokens = async (): Promise<void> => {
    try {
        // Sign out from AWS Cognito using Amplify
        await signOut();
        console.log('User logged out successfully');
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    } finally{
        // Remove all keys that start with common Amplify prefixes
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('CognitoIdentityServiceProvider.')
            )) {
                keysToRemove.push(key);
            }
        }
        // Remove all identified keys
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('Auth tokens cleared successfully');
    }
};