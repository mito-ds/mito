/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FileUploadPopup } from './DeployFilesSelector';
import { NotebookPanel } from '@jupyterlab/notebook';
import { getAppNameFromNotebookID } from '../AppPreview/utils';
import { getNotebookIDAndSetIfNonexistant } from '../../utils/notebookMetadata';


/**
 * Shows a file selector popup
 */
export const fileSelectorPopup = (notebookPanel: NotebookPanel): Promise<string[]> => {
  return new Promise<any>((resolve, reject) => {

    const notebookPath = notebookPanel.context.path
    const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel)

    if (notebookID === undefined) {
      // TODO: We should show some error here
      console.error("Failed to identify NotebookID")
      return
    }
    const appFileName = getAppNameFromNotebookID(notebookID)

    console.log("Starting file selector for:", notebookPath);

    // Create a container for the popup
    const popupContainer = document.createElement('div');
    popupContainer.id = 'file-selector-popup-container';
    document.body.appendChild(popupContainer);

    // Create root
    const root = createRoot(popupContainer);

    const handleSubmit = (items: string[]): void => {
      // Clean up the popup
      root.unmount();
      document.body.removeChild(popupContainer);
      resolve(items);
    };

    const handleClose = (): void => {
      // Clean up the popup
      root.unmount();
      document.body.removeChild(popupContainer);
      reject(new Error('File selection cancelled'));
    };

    // Render the AuthPopup
    root.render(
      <FileUploadPopup
        filePath={notebookPath}
        appFileName={appFileName}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );
  });
};
