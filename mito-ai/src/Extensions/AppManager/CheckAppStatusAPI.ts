/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { IAppManagerService } from './ManageAppsPlugin';
import type { ICheckAppStatusRequest, ICheckAppStatusReply } from '../../websockets/appManager/appManagerModels';

/**
 * Check if an app URL is accessible through the backend.
 */
export const checkAppStatus = async (
  appUrl: string,
  appManagerService: IAppManagerService
): Promise<boolean> => {
  try {

    // Create the request message with proper typing
    const request: ICheckAppStatusRequest = {
      type: 'check-app-status',
      app_url: appUrl
    };

    // Using websocket service
    const response: ICheckAppStatusReply = await appManagerService.client.sendMessage<ICheckAppStatusRequest, ICheckAppStatusReply>(request);

    // Check if the response indicates an error
    if (response.error) {
      console.error('Error checking app status:', response.error.title);
      return false;
    }

    console.log('App is accessible:', response.is_accessible);
    return response.is_accessible;

  } catch (error) {
    console.error('Error checking app status:', error);
    return false;
  }
};
