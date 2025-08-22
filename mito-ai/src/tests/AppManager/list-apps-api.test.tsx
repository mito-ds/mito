/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { fetchUserApps, App, GetAppsResponse } from '../../Extensions/AppManager/list-apps-api';
import { IAppManagerService } from '../../Extensions/AppManager/ManageAppsPlugin';
import { IManageAppReply, IManageAppRequest } from '../../websockets/appManager/appManagerModels';

// Mock the auth module
jest.mock('../../Extensions/AppBuilder/auth', () => ({
  getJWTToken: jest.fn()
}));

// Mock the UUID module
jest.mock('@lumino/coreutils', () => ({
  UUID: {
    uuid4: jest.fn()
  }
}));

const { getJWTToken } = require('../../Extensions/AppBuilder/auth');
const { UUID } = require('@lumino/coreutils');

describe('list-apps-api', () => {
  let mockAppManagerService: IAppManagerService;
  let mockWebsocketClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the websocket client
    mockWebsocketClient = {
      sendMessage: jest.fn(),
      serverSettings: {
        token: 'mock-server-token'
      }
    };

    // Mock the app manager service
    mockAppManagerService = {
      client: mockWebsocketClient
    } as any;

    // Mock UUID generation
    UUID.uuid4.mockReturnValue('mock-uuid-123');
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
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              app_name: 'Test App 2',
              url: 'https://test2.example.com',
              status: 'stopped',
              created_at: '2024-01-02T00:00:00Z'
            }
          ]
        };

        mockWebsocketClient.sendMessage.mockResolvedValue(mockWebsocketResponse);

        const result = await fetchUserApps(mockAppManagerService);

        expect(result.success).toBe(true);
        expect(result.apps).toHaveLength(2);
        expect(result.message).toBeUndefined();

        // Verify the request was made correctly
        expect(mockWebsocketClient.sendMessage).toHaveBeenCalledWith({
          type: 'manage-app',
          jwt_token: mockJWTToken
        });

        // Verify data transformation
        expect(result.apps[0]).toEqual({
          id: 'mock-uuid-123',
          name: 'Test App 1',
          url: 'https://test1.example.com',
          status: 'running',
          createdAt: '2024-01-01T00:00:00Z'
        });

        expect(result.apps[1]).toEqual({
          id: 'mock-uuid-123',
          name: 'Test App 2',
          url: 'https://test2.example.com',
          status: 'stopped',
          createdAt: '2024-01-02T00:00:00Z'
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
        expect(result.apps).toHaveLength(0);
        expect(result.message).toBeUndefined();
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
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              app_name: 'Stopped App',
              url: 'https://stopped.example.com',
              status: 'STOPPED',
              created_at: '2024-01-02T00:00:00Z'
            },
            {
              app_name: 'Deploying App',
              url: 'https://deploying.example.com',
              status: 'DEPLOYING',
              created_at: '2024-01-03T00:00:00Z'
            }
          ]
        };

        mockWebsocketClient.sendMessage.mockResolvedValue(mockWebsocketResponse);

        const result = await fetchUserApps(mockAppManagerService);

        expect(result.apps).toHaveLength(3);
        expect(result.apps[0]!.status).toBe('running');
        expect(result.apps[1]!.status).toBe('stopped');
        expect(result.apps[2]!.status).toBe('deploying');
      });
    });

    describe('Error handling', () => {
      test('should return error when user is not authenticated', async () => {
        getJWTToken.mockResolvedValue(null);
        mockWebsocketClient.serverSettings = { token: null };

        const result = await fetchUserApps(mockAppManagerService);

        expect(result.success).toBe(false);
        expect(result.apps).toHaveLength(0);
        expect(result.message).toBe('User not authenticated');
      });

      test('should handle websocket errors', async () => {
        getJWTToken.mockResolvedValue('valid-jwt-token');

        const mockError = new Error('WebSocket connection failed');
        mockWebsocketClient.sendMessage.mockRejectedValue(mockError);

        const result = await fetchUserApps(mockAppManagerService);

        expect(result.success).toBe(false);
        expect(result.apps).toHaveLength(0);
        expect(result.message).toBe('WebSocket connection failed');
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
        expect(result.apps).toHaveLength(0);
        expect(result.message).toBe('Error: Failed to fetch apps from backend');
      });
    });

    describe('Data transformation', () => {
      test('should generate unique UUIDs for each app', async () => {
        getJWTToken.mockResolvedValue('valid-jwt-token');

        const mockWebsocketResponse: IManageAppReply = {
          type: 'manage-app',
          apps: [
            {
              app_name: 'App 1',
              url: 'https://app1.example.com',
              status: 'running',
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              app_name: 'App 2',
              url: 'https://app2.example.com',
              status: 'stopped',
              created_at: '2024-01-02T00:00:00Z'
            }
          ]
        };

        mockWebsocketClient.sendMessage.mockResolvedValue(mockWebsocketResponse);

        // Mock different UUIDs for each call
        UUID.uuid4
          .mockReturnValueOnce('uuid-1')
          .mockReturnValueOnce('uuid-2');

          const result = await fetchUserApps(mockAppManagerService);

          expect(result.apps).toHaveLength(2);
          expect(result.apps[0]!.id).toBe('uuid-1');
          expect(result.apps[1]!.id).toBe('uuid-2');
      });
    });
  });
});
