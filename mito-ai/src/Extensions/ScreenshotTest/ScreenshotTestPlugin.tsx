/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { COMMAND_MITO_AI_TEST_SCREENSHOT } from '../../commands';
import { showScreenshotTestUI } from '../../utils/screenshotTestUI';

/**
 * Plugin for testing canvas screenshot capture with rectangle selection
 */
const ScreenshotTestPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:screenshot-test',
  autoStart: true,
  requires: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
    console.log('Mito AI: Screenshot Test Plugin activated');

    // Register the screenshot test command
    app.commands.addCommand(COMMAND_MITO_AI_TEST_SCREENSHOT, {
      label: '📸 Test Screenshot Capture',
      caption: 'Open screenshot test UI with rectangle selection',
      execute: () => {
        console.log('[Screenshot Test] Opening test UI...');
        showScreenshotTestUI();
      }
    });

    // Add to command palette
    palette.addItem({
      command: COMMAND_MITO_AI_TEST_SCREENSHOT,
      category: 'Mito AI',
      args: {}
    });

    console.log('[Screenshot Test] Command registered: mito-ai:test-screenshot');
  }
};

export default ScreenshotTestPlugin;
