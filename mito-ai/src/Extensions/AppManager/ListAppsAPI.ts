/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// list-apps-api.ts - Backend API function

import { IManageAppReply, IManageAppRequest } from '../../websockets/appManager/appManagerModels';
import { getJWTToken } from '../AppDeploy/auth';

// Import the actual service interface from the plugin
import { IAppManagerService } from './ManageAppsPlugin';

export type AppStatus = 'active' | 'deploying' | 'error' | 'shut down';

export interface AppMetadata {
  name: string;
  url: string;
  status: AppStatus;
  lastDeployedAt: string;
}

export interface GetAppsSuccess {
  success: true;
  apps: AppMetadata[];
}

export interface GetAppsFailure {
  success: false;
  errorMessage: string;
}

export type GetAppsResponse = GetAppsSuccess | GetAppsFailure;

// Type guards for working with the discriminated union
export const isGetAppsSuccess = (response: GetAppsResponse): response is GetAppsSuccess => {
  return response.success === true;
};

export const isGetAppsFailure = (response: GetAppsResponse): response is GetAppsFailure => {
  return response.success === false;
};

export const fetchUserApps = async (
  appManagerService: IAppManagerService
): Promise<GetAppsResponse> => {
  try {
    const jwtToken = await getJWTToken();
    if (!jwtToken) {
      return {
        success: false,
        errorMessage: 'User not authenticated'
      };
    }

    // Create the request message with proper typing
    const request: IManageAppRequest = {
      type: 'manage-app',
      jwt_token: jwtToken
    };

    // Using websocket service with correct message structure and proper typing
    const response: IManageAppReply = await appManagerService.client.sendMessage<IManageAppRequest, IManageAppReply>(request);

    // Check if the response indicates an error
    if (response.error) {
      return {
        success: false,
        errorMessage: response.error.title || 'Failed to fetch apps'
      };
    }

    // Transform the response to match expected format
    const apps: AppMetadata[] = (response.apps || []).map(app => ({
      name: app.app_name,
      url: app.url,
      status: (app.status?.toLowerCase() as AppStatus),
      lastDeployedAt: app.last_deployed_at
    }));

    return {
      success: true,
      apps
    };

  } catch (error) {
    console.error('Error fetching apps:', error);
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Failed to fetch apps'
    };
  }
};