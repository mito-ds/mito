/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { checkForUpdates } from '../../utils/version_check';

// Check interval - once per day in milliseconds
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; 

// Cache key for storing the last check time
const CACHE_KEY = 'mito-ai-last-version-check';

/**
 * Plugin to check for updates of Mito AI.
 * This will only show a notification if an update is available.
 * If any errors occur or if the extension can't check for updates, no notification will be shown.
 */
export const versionCheckPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:version-check',
  autoStart: true,
  requires: [],
  activate: (app: JupyterFrontEnd): void => {
    // Make sure the app is fully initialized before checking for updates
    void app.started.then(() => {
      // Check if we should perform a version check based on last check time
      const shouldCheck = shouldPerformCheck();
      
      if (shouldCheck) {
        // Perform the check and handle any errors
        return performVersionCheck(app)
          .catch(error => {
            console.warn('Error checking for Mito AI updates:', error);
          })
          .finally(() => {
            // Update the last check timestamp regardless of success/failure
            updateLastCheckTime();
          });
      }
      return Promise.resolve();
    }).catch(error => {
      console.warn('Error during JupyterLab initialization:', error);
    });
    
    // Set up periodic checks
    setUpPeriodicChecks(app);
  }
};

/**
 * Determines if we should perform a version check based on the last check time
 */
function shouldPerformCheck(): boolean {
  try {
    const lastCheck = window.localStorage.getItem(CACHE_KEY);
    
    if (!lastCheck) {
      return true; // No record of previous check, so perform check
    }
    
    const lastCheckTime = parseInt(lastCheck, 10);
    const currentTime = Date.now();
    
    // Check if the last check was more than the check interval ago
    return (currentTime - lastCheckTime) > CHECK_INTERVAL;
  } catch (error) {
    // If there's any error (e.g., localStorage not available), default to performing the check
    console.warn('Error checking last version check time:', error);
    return true;
  }
}

/**
 * Updates the last check time to the current time
 */
function updateLastCheckTime(): void {
  try {
    window.localStorage.setItem(CACHE_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Error updating last version check time:', error);
  }
}

/**
 * Performs the version check
 */
async function performVersionCheck(app: JupyterFrontEnd): Promise<void> {
  return checkForUpdates(app.serviceManager.serverSettings);
}

/**
 * Sets up periodic checks for updates
 */
function setUpPeriodicChecks(app: JupyterFrontEnd): void {
  // Don't set up periodic checks in node environments (for testing)
  if (typeof window === 'undefined') {
    return;
  }
  
  // Check once per day
  setInterval(() => {
    void performVersionCheck(app).catch(error => {
      console.warn('Error during periodic version check:', error);
    });
  }, CHECK_INTERVAL);
} 