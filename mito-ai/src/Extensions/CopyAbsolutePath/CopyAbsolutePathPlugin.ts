/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { Clipboard } from '@jupyterlab/apputils';
import { PageConfig, PathExt } from '@jupyterlab/coreutils';
import { fileIcon } from '@jupyterlab/ui-components';
import { Token } from '@lumino/coreutils';

const COMMAND_COPY_ABSOLUTE_PATH = 'mito_ai:copy-absolute-path';

/**
 * Plugin that adds a "Copy Absolute Path" option to the file browser context menu.
 * This is useful when users need the full filesystem path (e.g., on JupyterHub
 * where paths like /joyvan/work/file.csv are needed for cross-directory imports).
 */
const CopyAbsolutePathPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito_ai:copy-absolute-path',
  description: 'Add Copy Absolute Path to file browser context menu',
  autoStart: true,
  requires: [IFileBrowserFactory as unknown as Token<any>],
  activate: (app: JupyterFrontEnd, factory: IFileBrowserFactory) => {
    // Get the server root path - this is the absolute path where the Jupyter server is running
    const serverRoot = PageConfig.getOption('serverRoot');

    app.commands.addCommand(COMMAND_COPY_ABSOLUTE_PATH, {
      label: 'Copy Absolute Path',
      caption: 'Copy the absolute filesystem path to the clipboard',
      icon: fileIcon.bindprops({ stylesheet: 'menuItem' }),
      execute: () => {
        const widget = factory.tracker.currentWidget;
        if (!widget) {
          return;
        }

        // Get the first selected item
        const item = widget.selectedItems().next().value;
        if (!item) {
          return;
        }

        // Construct the absolute path by combining server root with the relative path
        // item.path is the path relative to the server root
        // Use PathExt.join to handle trailing slashes properly
        const absolutePath = serverRoot
          ? PathExt.join(serverRoot, item.path)
          : PathExt.join('/', item.path);

        // Copy to clipboard
        Clipboard.copyToSystem(absolutePath);
      }
    });
  }
};

export default CopyAbsolutePathPlugin;
