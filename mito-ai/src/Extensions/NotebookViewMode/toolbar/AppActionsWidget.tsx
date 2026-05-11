/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ReactWidget } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import {
  getAppNameFromNotebookID,
  showRecreateAppConfirmation
} from '../../AppPreview/utils';
import { showUpdateAppDropdown } from '../../AppPreview/UpdateAppDropdown';
import { deployStreamlitApp } from '../../AppDeploy/DeployStreamlitApp';
import { IAppDeployService } from '../../AppDeploy/AppDeployPlugin';
import { IAppManagerService } from '../../AppManager/ManageAppsPlugin';
import { COMMAND_MITO_AI_BETA_MODE_ENABLED } from '../../../commands';
import { getNotebookIDAndSetIfNonexistant } from '../../../utils/notebookMetadata';
import ChevronIcon from '../../../icons/ChevronIcon';
import LightningIcon from '../../../icons/LightningIcon';
import MagicWand from '../../../icons/MagicWand';
import Pencil from '../../../icons/Pencil';
import RestartIcon from '../../../icons/RestartIcon';
import { INotebookViewMode } from '../NotebookViewModePlugin';
import { getEditWithAIShortcutLabel } from '../mitoToolbarWidgetUtils';

interface IAppActionsContentProps {
  isEditMenuOpen: boolean;
  activeActionIndex: number;
  showDeploy: boolean;
  onToggleEditMenu: () => void;
  onMenuKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onExecuteAction: (index: number) => void;
  onDeployApp: () => void;
}

const AppActionsContent: React.FC<IAppActionsContentProps> = ({
  isEditMenuOpen,
  activeActionIndex,
  showDeploy,
  onToggleEditMenu,
  onMenuKeyDown,
  onExecuteAction,
  onDeployApp
}) => {
  return (
    <div className="mito-app-actions-root" onKeyDown={onMenuKeyDown}>
      <button
        type="button"
        className="mito-app-edit-trigger"
        aria-haspopup="menu"
        aria-expanded={isEditMenuOpen}
        onClick={onToggleEditMenu}
        title="Edit App"
      >
        <span className="mito-app-edit-trigger-icon" aria-hidden>
          <MagicWand />
        </span>
        <span>Edit App</span>
        <span className="mito-app-edit-trigger-caret" aria-hidden>
          <ChevronIcon direction={isEditMenuOpen ? 'up' : 'down'} />
        </span>
      </button>
      {isEditMenuOpen && (
        <div className="mito-app-edit-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className={`mito-app-edit-menu-item${activeActionIndex === 0 ? ' active' : ''}`}
            data-active-option={activeActionIndex === 0}
            onClick={() => onExecuteAction(0)}
          >
            <span className="mito-app-edit-menu-item-icon brand" aria-hidden>
              <MagicWand />
            </span>
            <span className="mito-app-edit-menu-item-text">
              <span className="mito-app-edit-menu-item-title">Edit with AI</span>
              <span className="mito-app-edit-menu-item-subtitle">
                Describe a change in the AI taskpane.
              </span>
            </span>
            <span className="mito-app-edit-menu-item-kbd">
              {getEditWithAIShortcutLabel()}
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={`mito-app-edit-menu-item${activeActionIndex === 1 ? ' active' : ''}`}
            data-active-option={activeActionIndex === 1}
            onClick={() => onExecuteAction(1)}
          >
            <span className="mito-app-edit-menu-item-icon brand" aria-hidden>
              <Pencil />
            </span>
            <span className="mito-app-edit-menu-item-text">
              <span className="mito-app-edit-menu-item-title">View source code</span>
              <span className="mito-app-edit-menu-item-subtitle">
                Open the generated app code to read or edit by hand.
              </span>
            </span>
          </button>
          <div className="mito-app-edit-menu-divider" />
          <button
            type="button"
            role="menuitem"
            className={`mito-app-edit-menu-item${activeActionIndex === 2 ? ' active' : ''}`}
            data-active-option={activeActionIndex === 2}
            onClick={() => onExecuteAction(2)}
          >
            <span className="mito-app-edit-menu-item-icon warn" aria-hidden>
              <RestartIcon />
            </span>
            <span className="mito-app-edit-menu-item-text">
              <span className="mito-app-edit-menu-item-title">Recreate from notebook</span>
              <span className="mito-app-edit-menu-item-subtitle">
                Regenerate the app from the current notebook. Discards manual edits.
              </span>
            </span>
          </button>
        </div>
      )}
      {showDeploy && (
        <button
          type="button"
          className="mito-app-deploy-button"
          onClick={onDeployApp}
          title="Deploy Streamlit App"
        >
          <span className="mito-app-deploy-button-icon" aria-hidden>
            <LightningIcon />
          </span>
          Deploy App
        </button>
      )}
    </div>
  );
};

export class AppActionsWidget extends ReactWidget {
  private _panel: NotebookPanel | null = null;
  private _isEditMenuOpen = false;
  private _activeActionIndex = 0;

  constructor(
    private readonly app: JupyterFrontEnd,
    private readonly documentManager: IDocumentManager,
    private readonly appDeployService: IAppDeployService,
    private readonly appManagerService: IAppManagerService,
    private readonly viewMode: INotebookViewMode
  ) {
    super();
    this.addClass('mito-top-toolbar-app-actions');
    this.viewMode.modeChanged.connect(() => this.update());
  }

  onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    document.addEventListener('mousedown', this._handleDocumentMouseDown);
    document.addEventListener('keydown', this._handleDocumentKeyDown);
  }

  onBeforeDetach(msg: Message): void {
    document.removeEventListener('mousedown', this._handleDocumentMouseDown);
    document.removeEventListener('keydown', this._handleDocumentKeyDown);
    super.onBeforeDetach(msg);
  }

  setPanel(panel: NotebookPanel | null): void {
    this._panel = panel;
    this.update();
  }

  render(): JSX.Element | null {
    if (!this._panel) {
      return null;
    }

    return (
      <AppActionsContent
        isEditMenuOpen={this._isEditMenuOpen}
        activeActionIndex={this._activeActionIndex}
        showDeploy={this.app.commands.hasCommand(COMMAND_MITO_AI_BETA_MODE_ENABLED)}
        onToggleEditMenu={() => this._setEditMenuOpen(!this._isEditMenuOpen)}
        onMenuKeyDown={this._handleMenuKeyDown}
        onExecuteAction={this._executeAction}
        onDeployApp={this._deployApp}
      />
    );
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

  private _editWithAI = (): void => {
    if (!this._panel) {
      return;
    }
    const triggerButton = this.node.querySelector<HTMLElement>('.mito-app-edit-trigger');
    if (!triggerButton) {
      return;
    }
    showUpdateAppDropdown(triggerButton, this._panel);
    this._setEditMenuOpen(false);
  };

  private _setEditMenuOpen = (isOpen: boolean): void => {
    this._isEditMenuOpen = isOpen;
    this._activeActionIndex = 0;
    this.update();
  };

  private _executeAction = (index: number): void => {
    if (!this._panel) {
      return;
    }

    if (index === 0) {
      this._editWithAI();
      return;
    }
    if (index === 1) {
      this._openAppCode(this._panel);
      this._setEditMenuOpen(false);
      return;
    }
    if (index === 2) {
      void showRecreateAppConfirmation(
        this._panel.context.path,
        getNotebookIDAndSetIfNonexistant(this._panel)
      );
      this._setEditMenuOpen(false);
    }
  };

  private _deployApp = (): void => {
    if (!this._panel) {
      return;
    }
    void deployStreamlitApp(this._panel, this.appDeployService, this.appManagerService);
  };

  private _handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!this._isEditMenuOpen) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._activeActionIndex = Math.min(2, this._activeActionIndex + 1);
      this.update();
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._activeActionIndex = Math.max(0, this._activeActionIndex - 1);
      this.update();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this._executeAction(this._activeActionIndex);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this._setEditMenuOpen(false);
    }
  };

  private _handleDocumentMouseDown = (event: MouseEvent): void => {
    if (!this._isEditMenuOpen) {
      return;
    }
    if (!this.node.contains(event.target as Node)) {
      this._setEditMenuOpen(false);
    }
  };

  private _handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (!this._panel || this.viewMode.getMode() !== 'App') {
      return;
    }

    const key = event.key.toLowerCase();
    const usesMeta = event.metaKey && !event.ctrlKey;
    const usesCtrl = event.ctrlKey && !event.metaKey;
    if ((usesMeta || usesCtrl) && key === 'e') {
      event.preventDefault();
      this._editWithAI();
    } else if (event.key === 'Escape' && this._isEditMenuOpen) {
      this._setEditMenuOpen(false);
    }
  };
}
