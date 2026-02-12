/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { ReactWidget } from '@jupyterlab/ui-components';
import { NotebookPanel } from '@jupyterlab/notebook';
import NotebookViewModeSwitcher from './NotebookViewModeSwitcher';
import type { NotebookViewMode } from './NotebookViewModePlugin';
import { showUpdateAppDropdown } from '../AppPreview/UpdateAppDropdown';
import { showRecreateAppConfirmation } from '../AppPreview/utils';
import { getNotebookIDAndSetIfNonexistant } from '../../utils/notebookMetadata';
import { deployStreamlitApp } from '../AppDeploy/DeployStreamlitApp';
import { IAppDeployService } from '../AppDeploy/AppDeployPlugin';
import { IAppManagerService } from '../AppManager/ManageAppsPlugin';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { COMMAND_MITO_AI_BETA_MODE_ENABLED } from '../../commands';
import '../../../style/AppModeToolbar.css';

export const APP_MODE_TOOLBAR_CLASS = 'mito-app-mode-toolbar-widget';

interface IAppModeToolbarProps {
  mode: NotebookViewMode;
  onModeChange: (mode: NotebookViewMode) => void;
  notebookPanel: NotebookPanel;
  appDeployService: IAppDeployService;
  appManagerService: IAppManagerService;
  app: JupyterFrontEnd;
}

const AppModeToolbar: React.FC<IAppModeToolbarProps> = ({
  mode,
  onModeChange,
  notebookPanel,
  appDeployService,
  appManagerService,
  app,
}) => {
  const notebookPath = notebookPanel.context.path;
  const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel);
  const showDeploy = app.commands.hasCommand(COMMAND_MITO_AI_BETA_MODE_ENABLED);

  return (
    <div className="app-mode-toolbar">
      <div className="app-mode-toolbar-left">
        <NotebookViewModeSwitcher mode={mode} onModeChange={onModeChange} />
      </div>
      <div className="app-mode-toolbar-right">
        <button
          type="button"
          className="text-button-mito-ai button-base button-small"
          onClick={(e) => {
            showUpdateAppDropdown(e.currentTarget, notebookPanel);
          }}
          title="Edit Streamlit App"
        >
          Edit App
        </button>
        <button
          type="button"
          className="text-button-mito-ai button-base button-small"
          onClick={() => {
            void showRecreateAppConfirmation(notebookPath, notebookID);
          }}
          title="Recreate new App from scratch based on the current state of the notebook"
        >
          Recreate App
        </button>
        {showDeploy && (
          <button
            type="button"
            className="text-button-mito-ai button-base button-small"
            onClick={() => {
              void deployStreamlitApp(notebookPanel, appDeployService, appManagerService);
            }}
            title="Deploy Streamlit App"
          >
            Deploy App
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Lumino ReactWidget wrapper for the App mode toolbar.
 * Added to NotebookPanel.contentHeader, hidden by default,
 * shown only when the view mode is App.
 */
export class AppModeToolbarWidget extends ReactWidget {
  private _mode: NotebookViewMode = 'App';

  constructor(
    private readonly _notebookPanel: NotebookPanel,
    private readonly _onModeChange: (mode: NotebookViewMode) => void,
    private readonly _appDeployService: IAppDeployService,
    private readonly _appManagerService: IAppManagerService,
    private readonly _app: JupyterFrontEnd,
  ) {
    super();
    this.addClass(APP_MODE_TOOLBAR_CLASS);
  }

  setMode(mode: NotebookViewMode): void {
    this._mode = mode;
    this.update();
  }

  render(): JSX.Element {
    return (
      <AppModeToolbar
        mode={this._mode}
        onModeChange={this._onModeChange}
        notebookPanel={this._notebookPanel}
        appDeployService={this._appDeployService}
        appManagerService={this._appManagerService}
        app={this._app}
      />
    );
  }
}
