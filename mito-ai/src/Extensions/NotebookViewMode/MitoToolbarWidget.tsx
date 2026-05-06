/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { IToolbarWidgetRegistry, ToolbarRegistry } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { PathExt } from '@jupyterlab/coreutils';
import { ReactWidget, Toolbar } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { Widget, Panel, PanelLayout } from '@lumino/widgets';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
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
import FileIcon from '../../icons/FileIcon';
import ChevronIcon from '../../icons/ChevronIcon';
import MagicWand from '../../icons/MagicWand';
import Pencil from '../../icons/Pencil';
import RestartIcon from '../../icons/RestartIcon';
import LightningIcon from '../../icons/LightningIcon';

import '../../../style/MitoTopToolbar.css';
import '../../../style/RunCellButton.css';
import '../../../style/button.css';

const MAX_FILENAME_LENGTH = 24;
const IPYNB_EXTENSION = '.ipynb';
const LAUNCHER_COMMAND = 'launcher:create';

const getShortcutLabel = (): string => {
  if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
    return '⌘ K';
  }
  return 'Ctrl K';
};

const getDisplayName = (panel: NotebookPanel): string => {
  return PathExt.basename(panel.context.path) || panel.title.label;
};

const middleTruncateFilename = (filename: string): string => {
  if (filename.length <= MAX_FILENAME_LENGTH) {
    return filename;
  }

  const extension = filename.endsWith(IPYNB_EXTENSION) ? IPYNB_EXTENSION : '';
  const stem = extension ? filename.slice(0, -extension.length) : filename;
  const availableStemLength = MAX_FILENAME_LENGTH - extension.length - 1;
  const prefixLength = Math.ceil(availableStemLength / 2);
  const suffixLength = Math.floor(availableStemLength / 2);

  return `${stem.slice(0, prefixLength)}…${stem.slice(-suffixLength)}${extension}`;
};

const isToday = (timestamp: number): boolean => {
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const getRelativeTimestamp = (timestamp: number): string => {
  const elapsedMs = Date.now() - timestamp;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  if (elapsedMinutes < 1) {
    return 'now';
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hr ago`;
  }
  if (elapsedHours < 48) {
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  }).format(new Date(timestamp));
};

class TabDropdownWidget extends ReactWidget {
  private readonly _lastOpenedByPanelId = new Map<string, number>();
  private readonly _trackedPanelIds = new Set<string>();
  private _isOpen = false;
  private _activeOptionIndex = 0;

  constructor(
    private readonly app: JupyterFrontEnd,
    private readonly notebookTracker: INotebookTracker,
    private readonly viewMode: INotebookViewMode,
    private readonly getActivePanel: () => NotebookPanel | null
  ) {
    super();
    this.addClass('mito-top-toolbar-left');

    this.notebookTracker.forEach(panel => {
      this._setupPanel(panel);
    });
    this.notebookTracker.widgetAdded.connect((_, panel) => {
      this._setupPanel(panel);
      this.update();
    });
    this.notebookTracker.currentChanged.connect((_, panel) => {
      if (panel) {
        this._recordOpened(panel);
      }
      this.update();
    });
  }

  toggleDropdown(): void {
    this._setOpen(!this._isOpen, true);
  }

  render(): JSX.Element {
    const notebooks = this._getSortedNotebooks();
    const activePanel = this.getActivePanel();
    const activeFilename = activePanel ? getDisplayName(activePanel) : 'No active notebook';
    const triggerLabel =
      notebooks.length === 0 ? 'No notebooks open' : middleTruncateFilename(activeFilename);
    const triggerTitle = `Switch notebooks (${getShortcutLabel()})`;

    return (
      <div className="mito-tab-dropdown-root" onKeyDown={this._handleMenuKeyDown}>
        <button
          type="button"
          className="mito-tab-dropdown-trigger"
          aria-haspopup="menu"
          aria-expanded={this._isOpen}
          title={triggerTitle}
          onClick={() => this._setOpen(!this._isOpen, true)}
          onKeyDown={this._handleTriggerKeyDown}
        >
          <span className="mito-tab-dropdown-trigger-content">
            <span className="mito-tab-dropdown-filename">{triggerLabel}</span>
            {activePanel?.context.model.dirty && (
              <span className="mito-tab-dropdown-dirty-dot" title="Unsaved changes" />
            )}
            <span className="mito-tab-dropdown-caret" aria-hidden>
              <ChevronIcon direction={this._isOpen ? 'up' : 'down'} />
            </span>
          </span>
        </button>
        {this._isOpen && this._renderMenu(notebooks, activePanel)}
      </div>
    );
  }

  private _renderMenu(
    notebooks: NotebookPanel[],
    activePanel: NotebookPanel | null
  ): JSX.Element {
    const todayPanels = notebooks.filter(panel =>
      isToday(this._lastOpenedByPanelId.get(panel.id) ?? Date.now())
    );
    const earlierPanels = notebooks.filter(
      panel => !isToday(this._lastOpenedByPanelId.get(panel.id) ?? Date.now())
    );

    return (
      <div className="mito-tab-dropdown-menu" role="menu">
        <div className="mito-tab-dropdown-scroll-area">
          {notebooks.length > 0 && (
            <div className="mito-tab-dropdown-menu-meta">
              <span className="mito-tab-dropdown-menu-meta-title">Open notebooks</span>
              <span className="mito-tab-dropdown-menu-meta-shortcut">{getShortcutLabel()}</span>
            </div>
          )}
          {notebooks.length === 0 ? (
            <div className="mito-tab-dropdown-empty">No notebooks open</div>
          ) : (
            <>
              {todayPanels.length > 0 && (
                <>
                  <div className="mito-tab-dropdown-group-label">Today</div>
                  {todayPanels.map(panel =>
                    this._renderNotebookRow(panel, activePanel, notebooks)
                  )}
                </>
              )}
              {earlierPanels.length > 0 && (
                <>
                  <div className="mito-tab-dropdown-group-label">Earlier</div>
                  {earlierPanels.map(panel =>
                    this._renderNotebookRow(panel, activePanel, notebooks)
                  )}
                </>
              )}
            </>
          )}
        </div>
        <div className="mito-tab-dropdown-divider" />
        {this._renderFooter(notebooks.length)}
      </div>
    );
  }

  private _renderNotebookRow(
    panel: NotebookPanel,
    activePanel: NotebookPanel | null,
    notebooks: NotebookPanel[]
  ): JSX.Element {
    const optionIndex = notebooks.indexOf(panel);
    const filename = getDisplayName(panel);
    const isActivePanel = panel === activePanel;
    const isActiveOption = optionIndex === this._activeOptionIndex;
    const timestamp = this._lastOpenedByPanelId.get(panel.id) ?? Date.now();

    return (
      <div
        key={panel.id}
        role="menuitem"
        data-active-option={isActiveOption}
        tabIndex={isActiveOption ? 0 : -1}
        className={`mito-tab-dropdown-row${isActivePanel ? ' active' : ''}`}
        title={filename}
        onClick={() => this._activateNotebook(panel)}
      >
        <span className="mito-tab-dropdown-row-icon" aria-hidden>
          <FileIcon />
        </span>
        <span className="mito-tab-dropdown-row-filename">
          {middleTruncateFilename(filename)}
        </span>
        <span className="mito-tab-dropdown-row-time">
          {getRelativeTimestamp(timestamp)}
        </span>
        {panel.context.model.dirty ? (
          <span className="mito-tab-dropdown-row-action">
            <span className="mito-tab-dropdown-dirty-dot" title="Unsaved changes" />
          </span>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            className="mito-tab-dropdown-row-action mito-tab-dropdown-close"
            aria-label={`Close ${filename}`}
            title={`Close ${filename}`}
            onClick={event => {
              event.stopPropagation();
              panel.close();
              this.update();
            }}
          >
            x
          </button>
        )}
      </div>
    );
  }

  private _renderFooter(optionIndex: number): JSX.Element {
    const isActiveOption = optionIndex === this._activeOptionIndex;
    return (
      <button
        type="button"
        role="menuitem"
        data-active-option={isActiveOption}
        tabIndex={isActiveOption ? 0 : -1}
        className="mito-tab-dropdown-footer"
        onClick={this._openLauncher}
      >
        <span>+ New File</span>
        <span className="mito-tab-dropdown-footer-hint">Opens Launcher</span>
      </button>
    );
  }

  private _setupPanel(panel: NotebookPanel): void {
    if (this._trackedPanelIds.has(panel.id)) {
      return;
    }

    this._trackedPanelIds.add(panel.id);
    this._recordOpened(panel);
    panel.context.pathChanged.connect(() => this.update());
    panel.context.model.stateChanged.connect(() => this.update());
    panel.context.saveState.connect(() => this.update());
    panel.disposed.connect(() => {
      this._trackedPanelIds.delete(panel.id);
      this._lastOpenedByPanelId.delete(panel.id);
      this._activeOptionIndex = 0;
      this.update();
    });
  }

  private _getSortedNotebooks(): NotebookPanel[] {
    const notebooks: NotebookPanel[] = [];
    this.notebookTracker.forEach(panel => {
      notebooks.push(panel);
    });
    return notebooks.sort((a, b) => {
      return (
        (this._lastOpenedByPanelId.get(b.id) ?? 0) -
        (this._lastOpenedByPanelId.get(a.id) ?? 0)
      );
    });
  }

  private _recordOpened(panel: NotebookPanel): void {
    this._lastOpenedByPanelId.set(panel.id, Date.now());
  }

  private _setOpen(open: boolean, shouldFocusOption = false): void {
    if (this._isOpen === open) {
      return;
    }

    this._isOpen = open;
    if (open) {
      this._activeOptionIndex = this._getInitialOptionIndex();
      document.addEventListener('mousedown', this._handleDocumentMouseDown);
      document.addEventListener('keydown', this._handleDocumentKeyDown);
    } else {
      document.removeEventListener('mousedown', this._handleDocumentMouseDown);
      document.removeEventListener('keydown', this._handleDocumentKeyDown);
    }
    this.update();

    if (open && shouldFocusOption) {
      this._focusActiveOption();
    }
  }

  private _focusActiveOption(): void {
    requestAnimationFrame(() => {
      this.node
        .querySelector<HTMLElement>('[data-active-option="true"]')
        ?.focus();
    });
  }

  private _getInitialOptionIndex(): number {
    const notebooks = this._getSortedNotebooks();
    const activePanel = this.getActivePanel();
    const activePanelIndex = activePanel ? notebooks.indexOf(activePanel) : -1;
    if (activePanelIndex >= 0) {
      return activePanelIndex;
    }
    return notebooks.length > 0 ? 0 : 0;
  }

  private _moveActiveOption(delta: number): void {
    const optionCount = this._getSortedNotebooks().length + 1;
    this._activeOptionIndex =
      (this._activeOptionIndex + delta + optionCount) % optionCount;
    this.update();
    this._focusActiveOption();
  }

  private _activateCurrentOption(): void {
    const notebooks = this._getSortedNotebooks();
    const panel = notebooks[this._activeOptionIndex];
    if (panel) {
      this._activateNotebook(panel);
      return;
    }
    this._openLauncher();
  }

  private _activateNotebook(panel: NotebookPanel): void {
    this._recordOpened(panel);
    this.app.shell.activateById(panel.id);
    this.viewMode.syncToCurrentNotebook();
    this._setOpen(false);
  }

  private _openLauncher = (): void => {
    const activePanel = this.getActivePanel();
    const cwd = activePanel ? PathExt.dirname(activePanel.context.path) : undefined;
    if (this.app.commands.hasCommand(LAUNCHER_COMMAND)) {
      void this.app.commands.execute(LAUNCHER_COMMAND, cwd ? { cwd } : undefined);
    }
    this._setOpen(false);
  };

  private _handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this._setOpen(true, true);
  };

  private _handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!this._isOpen) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._moveActiveOption(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._moveActiveOption(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this._activateCurrentOption();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this._setOpen(false);
    }
  };

  private _handleDocumentMouseDown = (event: MouseEvent): void => {
    if (!this.node.contains(event.target as Node)) {
      this._setOpen(false);
    }
  };

  private _handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) {
      return;
    }

    if (!this._isOpen) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._moveActiveOption(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._moveActiveOption(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this._activateCurrentOption();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this._setOpen(false);
    }
  };
}

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

  render(): JSX.Element | null {
    if (!this._panel) {
      return null;
    }

    const showDeploy = this.app.commands.hasCommand(COMMAND_MITO_AI_BETA_MODE_ENABLED);
    const notebookPanel = this._panel;

    return (
      <div className="mito-app-actions-root" onKeyDown={this._handleMenuKeyDown}>
        <button
          type="button"
          className="mito-app-edit-trigger"
          aria-haspopup="menu"
          aria-expanded={this._isEditMenuOpen}
          onClick={() => this._setEditMenuOpen(!this._isEditMenuOpen)}
          title="Edit App"
        >
          <span className="mito-app-edit-trigger-icon" aria-hidden>
            <MagicWand />
          </span>
          <span>Edit App</span>
          <span className="mito-app-edit-trigger-caret" aria-hidden>
            <ChevronIcon direction={this._isEditMenuOpen ? 'up' : 'down'} />
          </span>
        </button>
        {this._isEditMenuOpen && (
          <div className="mito-app-edit-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              className={`mito-app-edit-menu-item${this._activeActionIndex === 0 ? ' active' : ''}`}
              data-active-option={this._activeActionIndex === 0}
              onClick={() => this._executeAction(0)}
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
              <span className="mito-app-edit-menu-item-kbd">{getShortcutLabel().replace('K', 'E')}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className={`mito-app-edit-menu-item${this._activeActionIndex === 1 ? ' active' : ''}`}
              data-active-option={this._activeActionIndex === 1}
              onClick={() => this._executeAction(1)}
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
              className={`mito-app-edit-menu-item${this._activeActionIndex === 2 ? ' active' : ''}`}
              data-active-option={this._activeActionIndex === 2}
              onClick={() => this._executeAction(2)}
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
            onClick={() => {
              void deployStreamlitApp(notebookPanel, this.appDeployService, this.appManagerService);
            }}
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
  }
}

export class MitoToolbarWidget extends Widget {
  private static readonly _TOOLBAR_POPUP_OPENER_ITEM_NAME = 'toolbar-popup-opener';

  private static readonly _DEFAULT_NOTEBOOK_ITEM_NAMES = new Set([
    'save',
    'insert',
    'cut',
    'copy',
    'paste',
    'run',
    'run-all',
    'restart',
    'interrupt',
    'restart-and-run',
    'cellType',
    'kernelName',
    'executionProgress',
    'debugger-icon'
  ]);

  private readonly _leftCluster: TabDropdownWidget;
  private readonly _centerWidget: ModeSwitcherWidget;
  private readonly _rightCluster = new Panel();
  private readonly _notebookJupyterControls = new Toolbar();
  private readonly _notebookExtensions = new Toolbar();
  private readonly _rightDivider = new Widget();
  private readonly _notebookHero = new NotebookHeroWidget();
  private readonly _appActions: AppActionsWidget;
  private _transferredNotebookItems: Array<{ name: string; widget: Widget }> = [];
  private _sourcePanelForTransferredItems: NotebookPanel | null = null;

  constructor(
    viewMode: INotebookViewMode,
    getActivePanel: () => NotebookPanel | null,
    notebookTracker: INotebookTracker,
    app: JupyterFrontEnd,
    private readonly toolbarRegistry: IToolbarWidgetRegistry,
    documentManager: IDocumentManager,
    appDeployService: IAppDeployService,
    appManagerService: IAppManagerService
  ) {
    super();
    this.id = 'mito-top-toolbar';
    this.addClass('mito-top-toolbar');
    this.node.setAttribute('role', 'toolbar');

    this._leftCluster = new TabDropdownWidget(app, notebookTracker, viewMode, getActivePanel);

    this._centerWidget = new ModeSwitcherWidget(viewMode, getActivePanel);

    this._rightCluster.addClass('mito-top-toolbar-right');
    this._notebookJupyterControls.addClass('mito-top-toolbar-jupyter-controls');
    this._notebookExtensions.addClass('mito-top-toolbar-notebook-extensions');
    this._rightDivider.addClass('mito-top-toolbar-right-divider');
    this._appActions = new AppActionsWidget(
      app,
      documentManager,
      appDeployService,
      appManagerService,
      viewMode
    );
    this._rightCluster.addWidget(this._notebookJupyterControls);
    this._rightCluster.addWidget(this._notebookExtensions);
    this._rightCluster.addWidget(this._rightDivider);
    this._rightCluster.addWidget(this._notebookHero);
    this._rightCluster.addWidget(this._appActions);

    const layout = new PanelLayout();
    this.layout = layout;
    layout.addWidget(this._leftCluster);
    layout.addWidget(this._centerWidget);
    layout.addWidget(this._rightCluster);

    this.setMode(viewMode.getMode());
  }

  get notebookExtensionsToolbar(): Toolbar {
    return this._notebookExtensions;
  }

  prepareNotebookExtensionToolbarForRebind(): void {
    if (!this._sourcePanelForTransferredItems) {
      this._transferredNotebookItems = [];
      return;
    }

    const sourceToolbar = this._sourcePanelForTransferredItems.toolbar as unknown as {
      addItem?: (name: string, widget: Widget) => void;
    };
    if (!sourceToolbar.addItem) {
      this._sourcePanelForTransferredItems = null;
      this._transferredNotebookItems = [];
      return;
    }

    this._transferredNotebookItems.forEach(({ name, widget }) => {
      sourceToolbar.addItem?.(name, widget);
    });
    this._sourcePanelForTransferredItems = null;
    this._transferredNotebookItems = [];
  }

  syncNotebookExtensionToolbar(panel: NotebookPanel | null): void {
    if (!panel) {
      return;
    }

    const sourceToolbar = panel.toolbar as unknown as {
      names?: () => Iterable<string>;
      removeItem?: (name: string) => Widget | undefined;
      children?: () => Iterable<Widget>;
      node?: HTMLElement;
    };
    this._hideToolbarPopupOpener({
      children: () => this._notebookExtensions.children(),
      node: this._notebookExtensions.node
    });
    const transferableItems = this._getTransferableNotebookItems(sourceToolbar);
    if (transferableItems.length === 0) {
      return;
    }

    this._sourcePanelForTransferredItems = panel;
    this._transferredNotebookItems = [];

    transferableItems.forEach(({ name, widget }) => {
      this._notebookExtensions.addItem(this._getTransferredItemName(name), widget);
      this._transferredNotebookItems.push({ name, widget });
    });
  }

  toggleTabDropdown(): void {
    this._leftCluster.toggleDropdown();
  }

  setMode(mode: NotebookViewMode): void {
    if (mode === 'App') {
      this._notebookJupyterControls.hide();
      this._notebookExtensions.hide();
      this._notebookHero.hide();
      this._rightDivider.show();
      this._appActions.show();
    } else if (mode === 'Notebook') {
      this._notebookJupyterControls.show();
      this._notebookExtensions.show();
      this._rightDivider.show();
      this._notebookHero.show();
      this._appActions.hide();
    } else {
      this._notebookJupyterControls.hide();
      this._notebookExtensions.hide();
      this._rightDivider.hide();
      this._notebookHero.hide();
      this._appActions.hide();
    }
  }

  setActivePanel(panel: NotebookPanel | null): void {
    this._centerWidget.update();
    this._setNotebookJupyterControls(panel);
    this._notebookHero.setPanel(panel);
    this._appActions.setPanel(panel);
  }

  private _setNotebookJupyterControls(panel: NotebookPanel | null): void {
    Array.from(this._notebookJupyterControls.children()).forEach((child) => {
      child.dispose();
    });

    if (!panel) {
      return;
    }

    const toolbarItems: ToolbarRegistry.IWidget[] = [
      {
        name: 'insert',
        command: 'notebook:insert-cell-below',
        icon: 'ui-components:add'
      },
      { name: 'cellType' }
    ];

    toolbarItems.forEach((item) => {
      this._notebookJupyterControls.addItem(
        item.name,
        this.toolbarRegistry.createWidget('Notebook', panel, item)
      );
    });
  }

  private _getTransferredItemName(itemName: string): string {
    return `third-party:${itemName}`;
  }

  private _getTransferableNotebookItems(sourceToolbar: {
    names?: () => Iterable<string>;
    removeItem?: (name: string) => Widget | undefined;
    children?: () => Iterable<Widget>;
    node?: HTMLElement;
  }): Array<{ name: string; widget: Widget }> {
    const transferableItems: Array<{ name: string; widget: Widget }> = [];
    this._hideToolbarPopupOpener(sourceToolbar);

    if (sourceToolbar.names && sourceToolbar.removeItem) {
      Array.from(sourceToolbar.names()).forEach(itemName => {
        if (
          MitoToolbarWidget._DEFAULT_NOTEBOOK_ITEM_NAMES.has(itemName) ||
          itemName === MitoToolbarWidget._TOOLBAR_POPUP_OPENER_ITEM_NAME
        ) {
          return;
        }
        const widget = sourceToolbar.removeItem?.(itemName);
        if (!widget) {
          return;
        }
        transferableItems.push({ name: itemName, widget });
      });
      return transferableItems;
    }

    if (!sourceToolbar.children || !sourceToolbar.node) {
      return transferableItems;
    }

    const names = Array.from(
      sourceToolbar.node.querySelectorAll<HTMLElement>('[data-jp-item-name]')
    )
      .map(node => node.getAttribute('data-jp-item-name'))
      .filter((name): name is string => Boolean(name));
    const widgets = Array.from(sourceToolbar.children());
    const pairCount = Math.min(names.length, widgets.length);
    for (let index = 0; index < pairCount; index += 1) {
      const name = names[index];
      const widget = widgets[index];
      if (!name || !widget) {
        continue;
      }
      if (MitoToolbarWidget._DEFAULT_NOTEBOOK_ITEM_NAMES.has(name)) {
        continue;
      }
      if (name === MitoToolbarWidget._TOOLBAR_POPUP_OPENER_ITEM_NAME) {
        widget.hide();
        continue;
      }
      transferableItems.push({ name, widget });
    }
    return transferableItems;
  }

  private _hideToolbarPopupOpener(sourceToolbar: {
    names?: () => Iterable<string>;
    children?: () => Iterable<Widget>;
    node?: HTMLElement;
  }): void {
    if (sourceToolbar.names && sourceToolbar.children) {
      const names = Array.from(sourceToolbar.names());
      const widgets = Array.from(sourceToolbar.children());
      const popupOpenerIndex = names.indexOf(
        MitoToolbarWidget._TOOLBAR_POPUP_OPENER_ITEM_NAME
      );
      if (popupOpenerIndex >= 0) {
        widgets[popupOpenerIndex]?.hide();
      }
    }

    const popupOpenerSelector = [
      `[data-jp-item-name="${MitoToolbarWidget._TOOLBAR_POPUP_OPENER_ITEM_NAME}"]`,
      `.${MitoToolbarWidget._TOOLBAR_POPUP_OPENER_ITEM_NAME}`
    ].join(', ');
    sourceToolbar.node
      ?.querySelectorAll<HTMLElement>(popupOpenerSelector)
      .forEach(node => {
        node.style.display = 'none';
      });
  }
}
