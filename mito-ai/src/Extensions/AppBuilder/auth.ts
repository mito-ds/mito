/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';


Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_Kk0f9mOfx',
      userPoolClientId: '6ara3u3l8sss738hrhbq1qtiqf',

      loginWith: {
        email: true,
        username: false,
      }
    },
  }
});

console.log('Amplify configuration loaded successfully');

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