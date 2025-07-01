/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { enhanceNotebookPanelFactory } from './cellFactories';

/**
 * Initialization data for the cell-headers extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cell-headers:plugin',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    console.log('JupyterLab cell headers extension is activated!');

    // Function to enhance a notebook panel
    const enhanceNotebook = (panel: any) => {
      try {
        enhanceNotebookPanelFactory(panel);
        console.log('Enhanced notebook with cell headers');
      } catch (error) {
        console.warn('Failed to enhance notebook:', error);
      }
    };

    // Track new notebooks
    notebookTracker.widgetAdded.connect((sender, panel) => {
      try {
        enhanceNotebook(panel);
      } catch (error) {
        console.warn('Failed to register notebook:', error);
      }
    });

    // Update existing notebooks
    try {
      notebookTracker.forEach(panel => {
        enhanceNotebook(panel);
      });
    } catch (error) {
      console.warn('Failed to process existing notebooks:', error);
    }

    // Clean up on deactivation (optional, for extension unloading)
    app.restored.then(() => {
      // Extension is fully loaded and restored
    });
  }
};

export default plugin;