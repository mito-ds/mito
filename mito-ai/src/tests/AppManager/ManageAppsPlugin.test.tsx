/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// ManageAppsPlugin.test.ts
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JupyterFrontEnd } from '@jupyterlab/application';
import ManageAppsPlugin from '../../Extensions/AppManager/ManageAppsPlugin';
import { AppManagerWebsocketClient } from '../../websockets/appManager/appManagerWebsocketClient';

// Mock the websocket client
jest.mock('../../websockets/appManager/appManagerWebsocketClient', () => {
  return {
    AppManagerWebsocketClient: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock AppsList so we can check if it is rendered
jest.mock('../../Extensions/AppManager/AppsList', () => ({
  AppsList: jest.fn(() => <div data-testid="apps-list">AppsList</div>),
}));

describe('ManageAppsPlugin', () => {
  let mockApp: JupyterFrontEnd;

  beforeEach(() => {
    mockApp = {
      serviceManager: { serverSettings: {} },
      shell: {
        add: jest.fn(),
      },
      commands: { addCommand: jest.fn() },
      restored: Promise.resolve(),
    } as unknown as JupyterFrontEnd;
  });

  // TODO: Let this test run again when we remove from beta
  it.skip('should activate the plugin and provide IAppManagerService', async () => {

    // Await in case activate returns a Promise
    const service = await ManageAppsPlugin.activate(mockApp);

    // Check that the service is provided
    expect(service.client).toBeDefined();
    expect(AppManagerWebsocketClient).toHaveBeenCalledWith({
      serverSettings: mockApp.serviceManager.serverSettings,
    });

    // Check that the widget is added to the shell
    expect(mockApp.shell.add).toHaveBeenCalled();
    const widgetArg = (mockApp.shell.add as jest.Mock).mock.calls[0][0];
    expect(widgetArg.id).toBe('manage-apps-widget');
    expect(widgetArg.title.label).toBe('Manage apps');

    // Render the widget to check that AppsList is rendered
    const { getByTestId } = render(widgetArg.render());
    expect(getByTestId('apps-list')).toBeInTheDocument();
  });

});
