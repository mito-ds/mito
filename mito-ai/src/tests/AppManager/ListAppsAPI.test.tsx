/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { fetchUserApps, isGetAppsSuccess, isGetAppsFailure } from '../../Extensions/AppManager/ListAppsAPI';
import { IAppManagerService } from '../../Extensions/AppManager/ManageAppsPlugin';
import { IManageAppReply } from '../../websockets/appManager/appManagerModels';

// Mock the auth module
jest.mock('../../Extensions/AppDeploy/auth', () => ({
  getJWTToken: jest.fn()
}));

const { getJWTToken } = require('../../Extensions/AppDeploy/auth');

describe('list-apps-api', () => {
  let mockAppManagerService: IAppManagerService;
  let mockWebsocketClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the websocket client
    mockWebsocketClient = {
      sendMessage: jest.fn()
    };

    // Mock the app manager service
    mockAppManagerService = {
      client: mockWebsocketClient
    } as any;
  });

  describe('fetchUserApps', () => {
    describe('Successful API calls', () => {
      test('should fetch apps successfully with valid JWT token', async () => {
        const mockJWTToken = 'valid-jwt-token';
        getJWTToken.mockResolvedValue(mockJWTToken);

        const mockWebsocketResponse: IManageAppReply = {
          type: 'manage-app',
          apps: [
            {
              app_name: 'Test App 1',
              url: 'https://test1.example.com',
              status: 'running',
              last_deployed_at: '2024-01-01 00:00'
            },
            {
              app_name: 'Test App 2',
              url: 'https://test2.example.com',
              status: 'stopped',
              last_deployed_at: '2024-02-01 00:00'
            }
          ]
        };

        mockWebsocketClient.sendMessage.mockResolvedValue(mockWebsocketResponse);

        const result = await fetchUserApps(mockAppManagerService);

        expect(result.success).toBe(true);
        expect(isGetAppsSuccess(result)).toBe(true);
        
        if (isGetAppsSuccess(result)) {
          expect(result.apps).toHaveLength(2);

          // Verify data transformation
          expect(result.apps[0]).toEqual({
            name: 'Test App 1',
            url: 'https://test1.example.com',
            status: 'running',
            lastDeployedAt: '2024-01-01 00:00'
          });

          expect(result.apps[1]).toEqual({
            name: 'Test App 2',
            url: 'https://test2.example.com',
            status: 'stopped',
            lastDeployedAt: '2024-02-01 00:00'
          });
        }

        // Verify the request was made correctly
        expect(mockWebsocketClient.sendMessage).toHaveBeenCalledWith({
          type: 'manage-app',
          jwt_token: mockJWTToken
        });
      });

      test('should handle empty apps list', async () => {
        getJWTToken.mockResolvedValue('valid-jwt-token');

        const mockWebsocketResponse: IManageAppReply = {
          type: 'manage-app',
          apps: []
        };

        mockWebsocketClient.sendMessage.mockResolvedValue(mockWebsocketResponse);

        const result = await fetchUserApps(mockAppManagerService);

        expect(result.success).toBe(true);
        expect(isGetAppsSuccess(result)).toBe(true);
        
        if (isGetAppsSuccess(result)) {
          expect(result.apps).toHaveLength(0);
        }
      });

      test('should handle different app statuses correctly', async () => {
        getJWTToken.mockResolvedValue('valid-jwt-token');

        const mockWebsocketResponse: IManageAppReply = {
          type: 'manage-app',
          apps: [
            {
              app_name: 'Running App',
              url: 'https://running.example.com',
              status: 'RUNNING',
              last_deployed_at: '2024-01-01 00:00'
            },
            {
              app_name: 'Stopped App',
              url: 'https://stopped.example.com',
              status: 'STOPPED',
              last_deployed_at: '2024-01-02 00:00'
            },
            {
              app_name: 'Deploying App',
              url: 'https://deploying.example.com',
              status: 'DEPLOYING',
              last_deployed_at: '2024-01-03 00:00'
            }
          ]
        };

        mockWebsocketClient.sendMessage.mockResolvedValue(mockWebsocketResponse);

        const result = await fetchUserApps(mockAppManagerService);

        expect(result.success).toBe(true);
        expect(isGetAppsSuccess(result)).toBe(true);
        
        if (isGetAppsSuccess(result)) {
          expect(result.apps).toHaveLength(3);
          expect(result.apps[0]!.status).toBe('running');
          expect(result.apps[1]!.status).toBe('stopped');
          expect(result.apps[2]!.status).toBe('deploying');
        }
      });
    });

    describe('Error handling', () => {
      test('should return error when user is not authenticated', async () => {
        getJWTToken.mockResolvedValue(null);

        const result = await fetchUserApps(mockAppManagerService);

        expect(result.success).toBe(false);
        expect(isGetAppsFailure(result)).toBe(true);
        
        if (isGetAppsFailure(result)) {
          expect(result.errorMessage).toBe('User not authenticated');
        }
      });

      test('should handle websocket errors', async () => {
        getJWTToken.mockResolvedValue('valid-jwt-token');

        const mockError = new Error('WebSocket connection failed');
        mockWebsocketClient.sendMessage.mockRejectedValue(mockError);

        const result = await fetchUserApps(mockAppManagerService);

        expect(result.success).toBe(false);
        expect(isGetAppsFailure(result)).toBe(true);
        
        if (isGetAppsFailure(result)) {
          expect(result.errorMessage).toBe('WebSocket connection failed');
        }
      });

      test('should handle websocket response with error field', async () => {
        getJWTToken.mockResolvedValue('valid-jwt-token');

        const mockWebsocketResponse: IManageAppReply = {
          type: 'manage-app',
          apps: [],
          error: {
            error_type: 'APIError',
            title: 'Failed to fetch apps from backend'
          }
        };

        mockWebsocketClient.sendMessage.mockResolvedValue(mockWebsocketResponse);

        const result = await fetchUserApps(mockAppManagerService);

        expect(result.success).toBe(false);
        expect(isGetAppsFailure(result)).toBe(true);
        
        if (isGetAppsFailure(result)) {
          expect(result.errorMessage).toBe('Failed to fetch apps from backend');
        }
      });
    });

    describe('Data transformation', () => {
      test('should transform app data correctly', async () => {
        getJWTToken.mockResolvedValue('valid-jwt-token');

        const mockWebsocketResponse: IManageAppReply = {
          type: 'manage-app',
          apps: [
            {
              app_name: 'App 1',
              url: 'https://app1.example.com',
              status: 'running',
              last_deployed_at: '2024-01-01 00:00'
            },
            {
              app_name: 'App 2',
              url: 'https://app2.example.com',
              status: 'stopped',
              last_deployed_at: '2024-01-02 00:00'
            }
          ]
        };

        mockWebsocketClient.sendMessage.mockResolvedValue(mockWebsocketResponse);

        const result = await fetchUserApps(mockAppManagerService);

        expect(result.success).toBe(true);
        expect(isGetAppsSuccess(result)).toBe(true);
        
        if (isGetAppsSuccess(result)) {
          expect(result.apps).toHaveLength(2);
          expect(result.apps[0]!.name).toBe('App 1');
          expect(result.apps[1]!.name).toBe('App 2');
        }
      });
    });
  });
});
