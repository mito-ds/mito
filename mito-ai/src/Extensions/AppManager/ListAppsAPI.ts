/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// list-apps-api.ts - Backend API function

import { IManageAppReply, IManageAppRequest } from '../../websockets/appManager/appManagerModels';
import { getJWTToken } from '../AppBuilder/auth';

// Import the actual service interface from the plugin
import { IAppManagerService } from './ManageAppsPlugin';

export interface AppMetadata {
  name: string;
  url: string;
  status: 'running' | 'stopped' | 'deploying';
  createdAt: string;
}

export interface GetAppsResponse {
  apps: AppMetadata[];
  success: boolean;
  message?: string;
}

export const fetchUserApps = async (
  appManagerService: IAppManagerService
): Promise<GetAppsResponse> => {
  try {
    const jwtToken = await getJWTToken();
    if (!jwtToken) {
      return {
        apps: [],
        success: false,
        message: 'User not authenticated'
      };
    }

    // Create the request message with proper typing
    const request: IManageAppRequest = {
      type: 'manage-app',
      jwt_token: jwtToken || appManagerService.client.serverSettings?.token
    };

    // Using websocket service with correct message structure and proper typing
    const response: IManageAppReply = await appManagerService.client.sendMessage<IManageAppRequest, IManageAppReply>(request);

    // Check if the response indicates an error
    if (response.error) {
      throw new Error(`Error: ${response.error.title || 'Failed to fetch apps'}`);
    }

    // Transform the response to match expected format
    const apps: AppMetadata[] = (response.apps || []).map(app => ({
      name: app.app_name,
      url: app.url,
      status: (app.status?.toLowerCase() as 'running' | 'stopped' | 'deploying') || 'stopped',
      createdAt: app.created_at
    }));

    const data: GetAppsResponse = {
      apps,
      success: !response.error,
      message: undefined // No message field available in response
    };

    return data;
  } catch (error) {
    console.error('Error fetching apps:', error);
    return {
      apps: [],
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch apps'
    };
  }
};