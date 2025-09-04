/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// ManageAppsPlugin.ts - Updated with IAppManagerService
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { Token } from '@lumino/coreutils';
import * as React from 'react';
import { AppsList } from './AppsList';
import { AppManagerWebsocketClient } from '../../websockets/appManager/appManagerWebsocketClient';
import { getSetting } from '../../restAPI/RestAPI';

/**
 * The token for the AppManager service.
 */
export const IAppManagerService = new Token<IAppManagerService>(
  'mito-ai:IAppManagerService',
  'Token for the AppManager service that provides access to the websocket client'
);

/**
 * Interface for the AppManager service.
 */
export interface IAppManagerService {
  /**
   * The websocket client for app management.
   */
  readonly client: AppManagerWebsocketClient;
}

/**
 * Implementation of the AppManager service.
 */
class AppManagerService implements IAppManagerService {
  /**
   * The websocket client for app management.
   */
  readonly client: AppManagerWebsocketClient;

  /**
   * Create a new AppManager service.
   */
  constructor(app: JupyterFrontEnd) {
    // Create the websocket client with the app's server settings
    this.client = new AppManagerWebsocketClient({
      serverSettings: app.serviceManager.serverSettings
    });

    // Initialize the websocket connection in the background
    void this.client.initialize().catch(error => {
      console.error('Failed to initialize AppManager websocket client:', error);
      // We don't need to throw the error since the client will attempt to reconnect when used
    });
  }
}

class ManageAppsWidget extends ReactWidget {
  private _appManagerService: IAppManagerService;

  constructor(appManagerService: IAppManagerService) {
    super();
    this._appManagerService = appManagerService;
  }

  render(): React.ReactElement {
    // Pass the appManagerService as a prop to the AppsList component
    return React.createElement(AppsList, {
      appManagerService: this._appManagerService
    });
  }
}

const ManageAppsPlugin: JupyterFrontEndPlugin<IAppManagerService> = {
  id: 'manage-apps:manage-app-plugin',
  autoStart: true,
  provides: IAppManagerService,
  activate: (app: JupyterFrontEnd): IAppManagerService => {
    console.log('ManageApps plugin activated');

    // Create the AppManager service
    const appManagerService = new AppManagerService(app);

    // Create and add the ManageApps widget
    const widget = new ManageAppsWidget(appManagerService);
    widget.title.label = 'Manage apps';
    widget.id = 'manage-apps-widget';

    // For now, only show the manage apps widget if beta mode is enabled
    getSetting('beta_mode').then(value => {
      if (value === 'true') {
        // Add to right sidebar
        app.shell.add(widget, 'right');
      }
    }).catch(error => {
        console.error('Error checking beta mode:', error);
    });
      
    // Return the service so other plugins can use it
    return appManagerService;
  }
};

export default ManageAppsPlugin;