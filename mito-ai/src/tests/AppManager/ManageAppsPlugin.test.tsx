/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import ManageAppsPlugin, { IAppManagerService } from '../../Extensions/AppManager/ManageAppsPlugin';
import { AppManagerWebsocketClient } from '../../websockets/appManager/appManagerWebsocketClient';

// Mock the AppManagerWebsocketClient
jest.mock('../../websockets/appManager/appManagerWebsocketClient');
const MockAppManagerWebsocketClient = AppManagerWebsocketClient as jest.MockedClass<typeof AppManagerWebsocketClient>;

// Mock the AppsList component
jest.mock('../../Extensions/AppManager/apps-list', () => ({
  AppsList: ({ appManagerService }: { appManagerService: IAppManagerService }) => (
    <div data-testid="apps-list" data-service-token={appManagerService.client.serverSettings?.token}>
      Mock AppsList Component
    </div>
  )
}));

// Mock the ReactWidget
jest.mock('@jupyterlab/apputils', () => ({
  ReactWidget: jest.fn().mockImplementation(({ children }: any) => ({
    title: { label: '' },
    id: '',
    addClass: jest.fn(),
    render: () => children
  }))
}));

describe('ManageAppsPlugin', () => {
  let mockApp: JupyterFrontEnd;
  let mockShell: any;
  let mockServiceManager: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the shell
    mockShell = {
      add: jest.fn()
    };

    // Mock the service manager
    mockServiceManager = {
      serverSettings: {
        token: 'mock-server-token',
        baseUrl: 'http://localhost:8888'
      }
    };

    // Mock the JupyterFrontEnd app
    mockApp = {
      shell: mockShell,
      serviceManager: mockServiceManager
    } as any;

    // Reset the MockAppManagerWebsocketClient
    MockAppManagerWebsocketClient.mockClear();
  });

  describe('Plugin Configuration', () => {
    test('should have correct plugin ID', () => {
      expect(ManageAppsPlugin.id).toBe('manage-apps:manage-app-plugin');
    });

    test('should auto-start', () => {
      expect(ManageAppsPlugin.autoStart).toBe(true);
    });

    test('should provide IAppManagerService', () => {
      expect(ManageAppsPlugin.provides).toBe(IAppManagerService);
    });
  });

  describe('Plugin Activation', () => {
    test('should activate successfully', () => {
      const result = ManageAppsPlugin.activate(mockApp) as IAppManagerService;
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('client');
      expect(result.client).toBeInstanceOf(AppManagerWebsocketClient);
    });

    test('should create AppManagerWebsocketClient with correct options', () => {
      ManageAppsPlugin.activate(mockApp);
      
      expect(MockAppManagerWebsocketClient).toHaveBeenCalledWith({
        serverSettings: mockApp.serviceManager.serverSettings
      });
    });

    test('should create ManageAppsWidget', () => {
      ManageAppsPlugin.activate(mockApp);
      
      expect(ReactWidget).toHaveBeenCalled();
    });

    test('should add widget to right sidebar', () => {
      ManageAppsPlugin.activate(mockApp);
      
      expect(mockShell.add).toHaveBeenCalledWith(
        expect.any(Object),
        'right'
      );
    });

    test('should set widget title and ID', () => {
      const mockWidget = {
        title: { label: '' },
        id: '',
        addClass: jest.fn()
      };
      
      (ReactWidget as unknown as jest.Mock).mockReturnValue(mockWidget);
      
      ManageAppsPlugin.activate(mockApp);
      
      expect(mockWidget.title.label).toBe('Manage apps');
      expect(mockWidget.id).toBe('manage-apps-widget');
    });
  });

  describe('AppManagerService', () => {
    let service: IAppManagerService;

    beforeEach(() => {
      service = ManageAppsPlugin.activate(mockApp) as IAppManagerService;
    });

    test('should implement IAppManagerService interface', () => {
      expect(service).toHaveProperty('client');
      expect(typeof service.client).toBe('object');
    });

    test('should have websocket client', () => {
      expect(service.client).toBeInstanceOf(AppManagerWebsocketClient);
    });

    test('should initialize websocket connection', () => {
      expect(service.client.initialize).toHaveBeenCalled();
    });

    test('should handle websocket initialization errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('Connection failed');
      
      // Mock the initialize method to throw an error
      service.client.initialize = jest.fn().mockRejectedValue(mockError);
      
      // Re-activate to trigger the error
      ManageAppsPlugin.activate(mockApp);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize AppManager websocket client:',
        mockError
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('ManageAppsWidget', () => {
    test('should render AppsList component', () => {
      const service = ManageAppsPlugin.activate(mockApp) as IAppManagerService;
      const { getByTestId } = render(React.createElement(service.client as any));
      
      expect(getByTestId('apps-list')).toBeInTheDocument();
    });

    test('should pass appManagerService to AppsList', () => {
      const service = ManageAppsPlugin.activate(mockApp) as IAppManagerService;
      const { getByTestId } = render(React.createElement(service.client as any));
      
      const appsList = getByTestId('apps-list');
      expect(appsList).toHaveAttribute('data-service-token', 'mock-server-token');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing service manager gracefully', () => {
      const appWithoutServiceManager = {
        ...mockApp,
        serviceManager: undefined
      } as any;

      expect(() => {
        ManageAppsPlugin.activate(appWithoutServiceManager);
      }).not.toThrow();
    });

    test('should handle missing server settings gracefully', () => {
      const appWithoutServerSettings = {
        ...mockApp,
        serviceManager: {
          serverSettings: undefined
        }
      } as any;

      expect(() => {
        ManageAppsPlugin.activate(appWithoutServerSettings);
      }).not.toThrow();
    });
  });
});
