/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ServerConnection } from '@jupyterlab/services';
import { Notification } from '@jupyterlab/apputils';
import * as semver from 'semver';

/**
 * Display a notification when Mito AI is outdated
 */
export function showVersionOutdatedNotification(currentVersion: string, latestVersion: string): void {
  Notification.emit(`Your Mito AI version (${currentVersion}) is outdated. Latest version is ${latestVersion}.`, 'warning', {
    autoClose: false,
    actions: [
      {
        label: 'Learn how to update',
        callback: () => {
          window.open('https://docs.trymito.io/getting-started/installing-mito', '_blank');
        }
      },
      {
        label: 'Release notes',
        callback: () => {
          window.open('https://docs.trymito.io/misc/release-notes', '_blank');
        }
      }
    ]
  });
}

/**
 * Check if there's a newer version of Mito AI available
 * @param serverSettings The server settings to use for the request
 * @returns A promise that resolves when the check is complete
 */
export async function checkForUpdates(serverSettings: ServerConnection.ISettings): Promise<void> {
  try {
    // Build the URL
    const baseUrl = serverSettings.baseUrl;
    const url = `${baseUrl}mito-ai/version-check`;
    
    // Set timeout to 5 seconds to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      // Make the request
      const response = await ServerConnection.makeRequest(
        url, 
        { 
          method: 'GET',
          signal: controller.signal 
        }, 
        serverSettings
      );
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn('Failed to check for Mito AI updates:', response.statusText);
        return;
      }
      
      const data = await response.json() as { current_version?: string; latest_version?: string };
      const { current_version, latest_version } = data;
      
      if (!current_version || !latest_version) {
        // If versions are null/undefined/empty, the server couldn't get it from PyPI
        // In this case, don't show any notification as requested
        return;
      }
      
      // Use semver to compare versions - first validate both versions
      const validCurrentVersion = semver.valid(current_version);
      const validLatestVersion = semver.valid(latest_version);
      
      if (!validCurrentVersion || !validLatestVersion) {
        console.warn('Invalid semver version format:', { current_version, latest_version });
        return;
      }
      
      // Now compare the valid versions
      if (semver.lt(validCurrentVersion, validLatestVersion)) {
        // Show a notification to the user
        showVersionOutdatedNotification(current_version, latest_version);
      }
    } finally {
      // Ensure timeout is cleared even if there's an error
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // In case of any error, just log it and don't show any notification
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('Version check request timed out');
    } else {
      console.warn('Error checking for Mito AI updates:', error);
    }
  }
} 