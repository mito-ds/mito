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
import '../../../style/ModeToolbar.css';

export const MODE_TOOLBAR_CLASS = 'mito-mode-toolbar-widget';

interface IModeToolbarProps {
  mode: NotebookViewMode;
  onModeChange: (mode: NotebookViewMode) => void;
  notebookPanel: NotebookPanel;
  appDeployService: IAppDeployService;
  appManagerService: IAppManagerService;
  app: JupyterFrontEnd;
}

const ModeToolbar: React.FC<IModeToolbarProps> = ({
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
    <div className="mode-toolbar">
      <div className="mode-toolbar-left">
        <NotebookViewModeSwitcher mode={mode} onModeChange={onModeChange} />
      </div>
      {mode === 'App' && (
        <div className="mode-toolbar-right">
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
      )}
    </div>
  );
};

/**
 * Lumino ReactWidget wrapper for the mode toolbar.
 * Added to NotebookPanel.contentHeader, hidden by default.
 * Shown in Document mode (mode switcher only) and App mode (mode switcher + app buttons).
 * Hidden in Notebook mode (native toolbar handles everything).
 */
export class ModeToolbarWidget extends ReactWidget {
  private _mode: NotebookViewMode = 'Notebook';

  constructor(
    private readonly _notebookPanel: NotebookPanel,
    private readonly _onModeChange: (mode: NotebookViewMode) => void,
    private readonly _appDeployService: IAppDeployService,
    private readonly _appManagerService: IAppManagerService,
    private readonly _app: JupyterFrontEnd,
  ) {
    super();
    this.addClass(MODE_TOOLBAR_CLASS);
  }

  setMode(mode: NotebookViewMode): void {
    this._mode = mode;
    this.update();
  }

  render(): JSX.Element {
    return (
      <ModeToolbar
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
