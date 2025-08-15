/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthPopup } from './auth-popup-deploy';

/**
 * Shows an authentication popup and returns a promise that resolves when authentication is successful
 */
export const showAuthenticationPopup = (): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    // Create a container for the popup
    const popupContainer = document.createElement('div');
    popupContainer.id = 'auth-popup-container';
    document.body.appendChild(popupContainer);

    // Create root for React 18
    const root = createRoot(popupContainer);

    const handleSuccess = (user: any): void => {
      // Clean up the popup
      root.unmount();
      document.body.removeChild(popupContainer);
      resolve(user);
    };

    const handleClose = (): void => {
      // Clean up the popup
      root.unmount();
      document.body.removeChild(popupContainer);
      reject(new Error('Authentication cancelled'));
    };

    // Render the AuthPopup
    root.render(
      <AuthPopup
        isOpen={true}
        onSuccess={handleSuccess}
        onClose={handleClose}
      />
    );
  });
};
