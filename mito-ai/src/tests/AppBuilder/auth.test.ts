/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
    getJWTToken,
    getAuthHeaders,
} from '../../Extensions/AppBuilder/auth';

// Mock AWS Amplify for testing
jest.mock('aws-amplify', () => ({
    Amplify: {
        configure: jest.fn(),
    },
    fetchAuthSession: jest.fn(),
}));

import { fetchAuthSession } from 'aws-amplify/auth';

// Mock fetchAuthSession
const mockFetchAuthSession = fetchAuthSession as jest.MockedFunction<typeof fetchAuthSession>;

describe('Authentication Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getJWTToken', () => {
        test('should return empty string when no session exists', async () => {
            mockFetchAuthSession.mockRejectedValue(new Error('No session'));
            
            const result = await getJWTToken();
            expect(result).toBe('');
        });

        test('should return empty string when session has no tokens', async () => {
            mockFetchAuthSession.mockResolvedValue({
                tokens: {}
            } as any);
            
            const result = await getJWTToken();
            expect(result).toBe('');
        });

        test('should return access token when available', async () => {
            mockFetchAuthSession.mockResolvedValue({
                tokens: {
                    accessToken: 'valid-token-123'
                }
            } as any);
            
            const result = await getJWTToken();
            expect(result).toBe('valid-token-123');
        });

        test('should return empty string on error', async () => {
            mockFetchAuthSession.mockRejectedValue(new Error('Network error'));
            
            const result = await getJWTToken();
            expect(result).toBe('');
        });
    });

    describe('getAuthHeaders', () => {
        test('should return empty object when no token available', async () => {
            mockFetchAuthSession.mockRejectedValue(new Error('No session'));
            
            const result = await getAuthHeaders();
            expect(result).toEqual({});
        });

        test('should return authorization header when token available', async () => {
            mockFetchAuthSession.mockResolvedValue({
                tokens: {
                    accessToken: 'valid-token-123'
                }
            } as any);
            
            const result = await getAuthHeaders();
            expect(result).toEqual({
                'Authorization': 'Bearer valid-token-123'
            });
        });

        test('should return empty object when token is empty string', async () => {
            mockFetchAuthSession.mockResolvedValue({
                tokens: {
                    accessToken: ''
                }
            } as any);
            
            const result = await getAuthHeaders();
            expect(result).toEqual({});
        });
    });
});