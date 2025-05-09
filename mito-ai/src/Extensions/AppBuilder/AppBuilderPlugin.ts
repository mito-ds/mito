/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { Token } from '@lumino/coreutils';
import { AppBuilderWebsocketClient } from '../../websockets/appBuilder/appBuilderWebsocketClient';

/**
 * The token for the AppBuilder service.
 */
export const IAppBuilderService = new Token<IAppBuilderService>(
  'mito-ai:IAppBuilderService',
  'Token for the AppBuilder service that provides access to the websocket client'
);

/**
 * Interface for the AppBuilder service.
 */
export interface IAppBuilderService {
  /**
   * The websocket client for app building.
   */
  readonly client: AppBuilderWebsocketClient;
}

/**
 * Implementation of the AppBuilder service.
 */
class AppBuilderService implements IAppBuilderService {
  /**
   * The websocket client for app building.
   */
  readonly client: AppBuilderWebsocketClient;

  /**
   * Create a new AppBuilder service.
   */
  constructor(app: JupyterFrontEnd) {
    // Create the websocket client with the app's server settings
    this.client = new AppBuilderWebsocketClient({
      serverSettings: app.serviceManager.serverSettings
    });

    // Initialize the websocket connection in the background
    void this.client.initialize().catch(error => {
      console.error('Failed to initialize AppBuilder websocket client:', error);
      // We don't need to throw the error since the client will attempt to reconnect when used
    });
  }
}

/**
 * The AppBuilder plugin that provides the websocket client.
 */
const AppBuilderPlugin: JupyterFrontEndPlugin<IAppBuilderService> = {
  id: 'mito-ai:app-builder',
  autoStart: true,
  provides: IAppBuilderService,
  activate: (app: JupyterFrontEnd): IAppBuilderService => {
    console.log('mito-ai: AppBuilderPlugin activated');
    return new AppBuilderService(app);
  }
};

export default AppBuilderPlugin; 