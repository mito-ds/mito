/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FileUploadPopup } from './DeployFilesSelector';

/**
 * Shows a file selector popup
 */
export const fileSelectorPopup = (notebookPath: string): Promise<any> => {
  return new Promise<any>((resolve, reject) => {

    console.log("Starting file selector for:", notebookPath);

    // Create a container for the popup
    const popupContainer = document.createElement('div');
    popupContainer.id = 'file-selector-popup-container';
    document.body.appendChild(popupContainer);

    // Create root
    const root = createRoot(popupContainer);

    const handleSubmit = (user: any): void => {
      // Clean up the popup
      root.unmount();
      document.body.removeChild(popupContainer);
      resolve(user);
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
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );
  });
};
