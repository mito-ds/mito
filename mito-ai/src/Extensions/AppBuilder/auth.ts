/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { fetchAuthSession } from 'aws-amplify/auth';
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