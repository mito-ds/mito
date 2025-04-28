/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ServerConnection } from '@jupyterlab/services';
import { Notification } from '@jupyterlab/apputils';

/**
 * Compare version strings in semver format (x.y.z)
 * Returns true if currentVersion is older than latestVersion
 */
export function isVersionOutdated(currentVersion: string, latestVersion: string): boolean {
  // Split version strings and convert to numbers
  const currentParts: number[] = currentVersion.split('.').map(Number);
  const latestParts: number[] = latestVersion.split('.').map(Number);
  
  // Compare each component
  const maxLength = Math.max(currentParts.length, latestParts.length);
  
  for (let i = 0; i < maxLength; i++) {
    // Use 0 as default if the component doesn't exist
    const currentPart = i < currentParts.length ? (currentParts[i] || 0) : 0;
    const latestPart = i < latestParts.length ? (latestParts[i] || 0) : 0;
    
    if (currentPart < latestPart) {
      return true; // Current version is older
    }
    
    if (currentPart > latestPart) {
      return false; // Current version is newer
    }
    
    // If equal, continue to next component
  }
  
  // Versions are identical
  return false;
}

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
    
    // Make the request
    const response = await ServerConnection.makeRequest(url, {}, serverSettings);
    
    if (!response.ok) {
      console.warn('Failed to check for Mito AI updates:', response.statusText);
      return;
    }
    
    const data = await response.json();
    const { current_version, latest_version } = data;
    
    if (!latest_version) {
      // If latest_version is null/undefined/empty, the server couldn't get it from PyPI
      // In this case, don't show any notification as requested
      return;
    }
    
    // Check if current version is outdated compared to the latest version
    if (isVersionOutdated(current_version, latest_version)) {
      // Show a notification to the user
      showVersionOutdatedNotification(current_version, latest_version);
    }
  } catch (error) {
    // In case of any error, just log it and don't show any notification
    console.warn('Error checking for Mito AI updates:', error);
  }
} 