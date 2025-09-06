/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { Token } from '@lumino/coreutils';
import { AppDeployWebsocketClient } from '../../websockets/appDeploy/appDeployWebsocketClient';

/**
 * The token for the AppDeploy service.
 */
export const IAppDeployService = new Token<IAppDeployService>(
  'mito-ai:IAppDeployService',
  'Token for the AppDeploy service that provides access to the websocket client'
);

/**
 * Interface for the AppDeploy service.
 */
export interface IAppDeployService {
  /**
   * The websocket client for deploying apps.
   */
  readonly client: AppDeployWebsocketClient;
}

/**
 * Implementation of the AppDeploy service.
 */
class AppDeployService implements IAppDeployService {
  /**
   * The websocket client for deploying apps.
   */
  readonly client: AppDeployWebsocketClient;

  /**
   * Create a new AppDeploy service.
   */
  constructor(app: JupyterFrontEnd) {
    // Create the websocket client with the app's server settings
    this.client = new AppDeployWebsocketClient({
      serverSettings: app.serviceManager.serverSettings
    });

    // Initialize the websocket connection in the background
    void this.client.initialize().catch(error => {
      console.error('Failed to initialize AppDeploy websocket client:', error);
      // We don't need to throw the error since the client will attempt to reconnect when used
    });
  }
}

/**
 * The AppDeploy plugin that provides the websocket client.
 */
const AppDeployPlugin: JupyterFrontEndPlugin<IAppDeployService> = {
  id: 'mito-ai:app-deploy',
  autoStart: true,
  provides: IAppDeployService,
  activate: (app: JupyterFrontEnd): IAppDeployService => {
    console.log('mito-ai: AppDeployPlugin activated');
    return new AppDeployService(app);
  }
};

export default AppDeployPlugin; 