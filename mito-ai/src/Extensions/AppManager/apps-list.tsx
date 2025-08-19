//app-list.tsx
import * as React from 'react';
import { copyIcon } from '@jupyterlab/ui-components';
import { logoutAndClearJWTTokens } from '../AppBuilder/auth';
import { fetchUserApps, GetAppsResponse, App } from './list-apps-api';
import { IAppManagerService } from './ManageAppsPlugin';

// Add props interface to receive the appManagerService
interface AppsListProps {
  appManagerService: IAppManagerService;
}

export const AppsList: React.FC<AppsListProps> = ({ appManagerService }) => {
  const [apps, setApps] = React.useState<App[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch apps on component mount
  React.useEffect(() => {
    const loadApps = async () => {
      try {
        console.log('[AppsList] Starting to load apps...');
        setLoading(true);
        setError(null);

        console.log('[AppsList] Calling fetchUserApps...');
        const response: GetAppsResponse = await fetchUserApps(appManagerService);
        console.log('[AppsList] fetchUserApps response:', response);

        if (response.success) {
          setApps(response.apps);
        } else {
          setError(response.message || 'Failed to load apps');
          setApps([]);
        }
      } catch (err) {
        console.error('[AppsList] Error loading apps:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setApps([]);
      } finally {
        setLoading(false);
      }
    };

    console.log('[AppsList] Component mounted, calling loadApps...');
    loadApps();
  }, [appManagerService]); // Add appManagerService to dependency array

  // Refresh function that can be called manually
  const refreshApps = async () => {
    const response = await fetchUserApps(appManagerService);
    if (response.success) {
      setApps(response.apps);
      setError(null);
    } else {
      setError(response.message || 'Failed to refresh apps');
    }
  };

  const copyToClipboard = async (url: string, appName: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return '#4caf50';
      case 'stopped':
        return '#f44336';
      case 'deploying':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div style={{ padding: '16px', fontSize: '13px', fontFamily: 'var(--jp-ui-font-family)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{
          margin: '0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'var(--jp-ui-font-color1)'
        }}>
          Your Apps
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={refreshApps}
            disabled={loading}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: 'transparent',
              color: 'var(--jp-ui-font-color2)',
              border: '1px solid var(--jp-border-color2)',
              borderRadius: '3px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'normal'
            }}
            title="Refresh apps"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={() => {
              console.log('Logout clicked');
              logoutAndClearJWTTokens();
            }}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: 'transparent',
              color: 'var(--jp-ui-font-color2)',
              border: '1px solid var(--jp-border-color2)',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'normal'
            }}
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{
          color: 'var(--jp-ui-font-color2)',
          textAlign: 'center',
          padding: '20px 0'
        }}>
          Loading apps...
        </div>
      ) : error ? (
        <div style={{
          color: '#f44336',
          textAlign: 'center',
          padding: '20px 0',
          backgroundColor: 'var(--jp-layout-color1)',
          border: '1px solid #f44336',
          borderRadius: '4px'
        }}>
          Error: {error}
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={refreshApps}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: 'var(--jp-brand-color1)',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      ) : apps.length === 0 ? (
        <div style={{
          color: 'var(--jp-ui-font-color2)',
          textAlign: 'center',
          padding: '20px 0'
        }}>
          No apps deployed yet
        </div>
      ) : (
        <div>
          {apps.map((app) => (
            <div
              key={app.id}
              style={{
                border: '1px solid var(--jp-border-color1)',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: 'var(--jp-layout-color0)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 'bold',
                    color: 'var(--jp-ui-font-color1)',
                    marginBottom: '4px'
                  }}>
                    {app.name}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(app.status),
                        marginRight: '6px'
                      }}
                    />
                    <span style={{
                      color: 'var(--jp-ui-font-color2)',
                      fontSize: '12px'
                    }}>
                      {getStatusText(app.status)}
                    </span>
                  </div>
                  <div style={{
                    color: 'var(--jp-ui-font-color2)',
                    fontSize: '11px'
                  }}>
                    Created: {app.createdAt}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--jp-layout-color1)',
                border: '1px solid var(--jp-border-color2)',
                borderRadius: '3px',
                padding: '6px 8px'
              }}>
                <div style={{
                  flex: 1,
                  color: 'var(--jp-ui-font-color1)',
                  fontSize: '11px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--jp-code-font-family)'
                }}>
                  {app.url}
                </div>
                <button
                  onClick={() => copyToClipboard(app.url, app.name)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '8px',
                    borderRadius: '2px'
                  }}
                  title={`Copy URL for ${app.name}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--jp-layout-color2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
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
  );
};