/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

//app-list.tsx
import * as React from 'react';
import { copyIcon } from '@jupyterlab/ui-components';
import { logoutAndClearJWTTokens } from '../AppDeploy/auth';
import { fetchUserApps, GetAppsResponse, AppMetadata, isGetAppsSuccess, AppStatus } from './ListAppsAPI';
import { IAppManagerService } from './ManageAppsPlugin';
import { showAuthenticationPopup } from '../AppDeploy/authPopupUtils';
import '../../../style/AppsList.css';
import '../../../style/button.css';

// Add props interface to receive the appManagerService
interface AppsListProps {
  appManagerService: IAppManagerService;
}

export const AppsList: React.FC<AppsListProps> = ({ appManagerService }) => {
  const [apps, setApps] = React.useState<AppMetadata[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshApps = async (): Promise<void> => {
    try {
      console.log('[AppsList] Refreshing apps...');
      setLoading(true);
      setError(null);

      const response: GetAppsResponse = await fetchUserApps(appManagerService);
      console.log('[AppsList] fetchUserApps response:', response);

      if (isGetAppsSuccess(response)) {
        setApps(response.apps);
      } else {
        setError(response.errorMessage || 'Failed to load apps');
        setApps([]);
      }
    } catch (err) {
      console.error('[AppsList] Error loading apps:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setApps([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
      void refreshApps();
    }, []);

  const handleLogin = async (): Promise<void> => {
    try {
      await showAuthenticationPopup();
      await refreshApps();
    } catch (err) {
      console.warn('[AppsList] Login popup closed or failed:', err);
    }
  };

  const copyToClipboard = async (url: string, appName: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      console.log(`Copied URL for ${appName}: ${url}`);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const getStatusColor = (status: AppStatus): string => {
    switch (status) {
      case 'active':
        return '#4caf50'; 
      case 'error':
        return '#f44336';
      case 'deploying':
        return '#2196f3';
      case 'shut down':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusText = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="apps-list-container">
      <div className="apps-list-header">
        <h3 className="apps-list-title">
          Your Apps
        </h3>
        <div className="apps-list-actions">
          <button
            onClick={refreshApps}
            disabled={loading}
            className="apps-list-button"
            title="Refresh apps"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={async () => {
              console.log('Logout clicked');
              try {
                await logoutAndClearJWTTokens();
              } catch (err) {
                console.error('[AppsList] Error during logout:', err);
              } finally{
                await refreshApps();
              }
            }}
            className="apps-list-button"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="apps-list-content">
      {loading ? (
        <div className="apps-list-loading">
          Loading apps...
        </div>
      ) : error ? (
        error === 'User not authenticated' ? (
          <div className="apps-list-auth-message">
            <div className="apps-list-auth-text">User not authenticated</div>
            <button
              onClick={handleLogin}
              className="button-base button-purple apps-list-auth-login-button"
            >
              Login
            </button>
          </div>
        ) : (
          <div className="apps-list-error">
            <>
              Error: {error}
              <div className="apps-list-error-actions">
                <button
                  onClick={refreshApps}
                  className="apps-list-button primary"
                >
                  Try Again
                </button>
              </div>
            </>
          </div>
        )
      ) : apps.length === 0 ? (
        <div className="apps-list-empty">
          No apps deployed yet
        </div>
      ) : (
        <div>
          {apps.map((app) => (
            <div key={app.name} className="app-item">
              <div className="app-item-header">
                <div className="app-item-content">
                  <div className="app-item-name">
                    {app.name}
                  </div>
                  <div className="app-item-status-container">
                    <span
                      className="app-item-status-indicator"
                      style={{ backgroundColor: getStatusColor(app.status) }}
                    />
                    <span className="app-item-status-text">
                      {getStatusText(app.status)}
                    </span>
                  </div>
                  <div className="app-item-last-deployed">
                    Last Deployed at: {app.lastDeployedAt}
                  </div>
                </div>
              </div>

              <div className="app-item-url-container">
                <div className="app-item-url">
                  {app.url}
                </div>
                <button
                  onClick={() => copyToClipboard(app.url, app.name)}
                  className="app-item-copy-button"
                  title={`Copy URL for ${app.name}`}
                >
                  <copyIcon.react
                    width="14px"
                    height="14px"
                    fill="var(--jp-ui-font-color2)"
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};