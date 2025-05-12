/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { checkForUpdates } from '../../utils/version_check';

/**
 * Plugin to check for updates of Mito AI.
 * This will only show a notification if an update is available.
 * If any errors occur or if the extension can't check for updates, no notification will be shown.
 */
export const versionCheckPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:version-check',
  autoStart: true,
  requires: [],
  activate: (app: JupyterFrontEnd) => {
    // Make sure the app is fully initialized before checking for updates
    app.started.then(() => {
      // Check for updates - this will only show a notification if an update is available
      // If any errors occur or if the extension can't check for updates, no notification will be shown
      checkForUpdates(app.serviceManager.serverSettings).catch(error => {
        console.warn('Error checking for Mito AI updates:', error);
      });
    });
  }
}; 