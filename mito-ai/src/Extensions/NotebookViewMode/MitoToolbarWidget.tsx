/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { PathExt } from '@jupyterlab/coreutils';
import { ReactWidget, Toolbar } from '@jupyterlab/ui-components';
import { Widget, Panel, PanelLayout } from '@lumino/widgets';
import { NotebookPanel } from '@jupyterlab/notebook';
import { showUpdateAppDropdown } from '../AppPreview/UpdateAppDropdown';
import { showRecreateAppConfirmation, getAppNameFromNotebookID } from '../AppPreview/utils';
import { getNotebookIDAndSetIfNonexistant } from '../../utils/notebookMetadata';
import { deployStreamlitApp } from '../AppDeploy/DeployStreamlitApp';
import { IAppDeployService } from '../AppDeploy/AppDeployPlugin';
import { IAppManagerService } from '../AppManager/ManageAppsPlugin';
import { COMMAND_MITO_AI_BETA_MODE_ENABLED } from '../../commands';
import RunCellButton from '../../components/RunCellButton';
import NotebookViewModeSwitcher from './NotebookViewModeSwitcher';
import { INotebookViewMode, NotebookViewMode } from './NotebookViewModePlugin';

import '../../../style/MitoTopToolbar.css';
import '../../../style/RunCellButton.css';
import '../../../style/button.css';

class ModeSwitcherWidget extends ReactWidget {
  constructor(
    private readonly viewMode: INotebookViewMode,
    private readonly getActivePanel: () => NotebookPanel | null
  ) {
    super();
    this.addClass('mito-top-toolbar-center');
    this.viewMode.modeChanged.connect(() => this.update());
  }

  render(): JSX.Element {
    const panel = this.getActivePanel();
    return (
      <NotebookViewModeSwitcher
        mode={panel ? this.viewMode.getMode() : 'Notebook'}
        disabled={!panel}
        onModeChange={(mode) => {
          if (!panel) {
            return;
          }
          if (mode === 'App') {
            void this.viewMode.openPreviewAndSwitchToAppMode(panel);
            return;
          }
          this.viewMode.setMode(mode);
        }}
      />
    );
  }
}

class NotebookHeroWidget extends ReactWidget {
  private _panel: NotebookPanel | null = null;

  constructor() {
    super();
    this.addClass('mito-top-toolbar-notebook-hero');
  }

  setPanel(panel: NotebookPanel | null): void {
    this._panel = panel;
    this.update();
  }

  render(): JSX.Element | null {
    if (!this._panel) {
      return null;
    }
    return <RunCellButton notebookPanel={this._panel} />;
  }
}

class AppActionsWidget extends ReactWidget {
  private _panel: NotebookPanel | null = null;

  constructor(
    private readonly app: JupyterFrontEnd,
    private readonly documentManager: IDocumentManager,
    private readonly appDeployService: IAppDeployService,
    private readonly appManagerService: IAppManagerService
  ) {
    super();
    this.addClass('mito-top-toolbar-app-actions');
  }

  setPanel(panel: NotebookPanel | null): void {
    this._panel = panel;
    this.update();
  }

  private _openAppCode = (notebookPanel: NotebookPanel): void => {
    const notebookPath = notebookPanel.context.path;
    const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel);
    if (!notebookID) {
      return;
    }
    const appFileName = getAppNameFromNotebookID(notebookID);
    const dirPath = PathExt.dirname(notebookPath);
    const appFilePath = PathExt.join(dirPath, appFileName);
    this.documentManager.open(appFilePath, undefined, undefined, {
      ref: notebookPanel.id,
      mode: 'split-right'
    });
  };

  render(): JSX.Element | null {
    if (!this._panel) {
      return null;
    }

    const showDeploy = this.app.commands.hasCommand(COMMAND_MITO_AI_BETA_MODE_ENABLED);
    const notebookPanel = this._panel;
    const notebookPath = notebookPanel.context.path;
    const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel);

    return (
      <>
        <button
          type="button"
          className="button-secondary-toolbar"
          onClick={() => this._openAppCode(notebookPanel)}
          title="Open the app source code alongside the preview"
        >
          Edit app code
        </button>
        <button
          type="button"
          className="button-secondary-toolbar"
          onClick={(e) => {
            showUpdateAppDropdown(e.currentTarget, notebookPanel);
          }}
          title="Edit Streamlit App"
        >
          Edit App
        </button>
        <button
          type="button"
          className="button-secondary-toolbar"
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
            className="button-base button-blue"
            onClick={() => {
              void deployStreamlitApp(notebookPanel, this.appDeployService, this.appManagerService);
            }}
            title="Deploy Streamlit App"
          >
            Deploy App
          </button>
        )}
      </>
    );
  }
}

export class MitoToolbarWidget extends Widget {
  private readonly _centerWidget: ModeSwitcherWidget;
  private readonly _rightCluster = new Panel();
  private readonly _notebookExtensions = new Toolbar();
  private readonly _notebookHero = new NotebookHeroWidget();
  private readonly _appActions: AppActionsWidget;

  constructor(
    viewMode: INotebookViewMode,
    getActivePanel: () => NotebookPanel | null,
    app: JupyterFrontEnd,
    documentManager: IDocumentManager,
    appDeployService: IAppDeployService,
    appManagerService: IAppManagerService
  ) {
    super();
    this.id = 'mito-top-toolbar';
    this.addClass('mito-top-toolbar');
    this.node.setAttribute('role', 'toolbar');

    const leftCluster = new Widget();
    leftCluster.addClass('mito-top-toolbar-left');

    this._centerWidget = new ModeSwitcherWidget(viewMode, getActivePanel);

    this._rightCluster.addClass('mito-top-toolbar-right');
    this._notebookExtensions.addClass('mito-top-toolbar-notebook-extensions');
    this._appActions = new AppActionsWidget(app, documentManager, appDeployService, appManagerService);
    this._rightCluster.addWidget(this._notebookExtensions);
    this._rightCluster.addWidget(this._notebookHero);
    this._rightCluster.addWidget(this._appActions);

    const layout = new PanelLayout();
    this.layout = layout;
    layout.addWidget(leftCluster);
    layout.addWidget(this._centerWidget);
    layout.addWidget(this._rightCluster);

    this.setMode(viewMode.getMode());
  }

  get notebookExtensionsToolbar(): Toolbar {
    return this._notebookExtensions;
  }

  setMode(mode: NotebookViewMode): void {
    if (mode === 'App') {
      this._notebookExtensions.hide();
      this._notebookHero.hide();
      this._appActions.show();
    } else if (mode === 'Notebook') {
      this._notebookExtensions.show();
      this._notebookHero.show();
      this._appActions.hide();
    } else {
      this._notebookExtensions.hide();
      this._notebookHero.hide();
      this._appActions.hide();
    }
  }

  setActivePanel(panel: NotebookPanel | null): void {
    this._centerWidget.update();
    this._notebookHero.setPanel(panel);
    this._appActions.setPanel(panel);
  }
}
