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
    const triggerTitle = activePanel ? getDisplayName(activePanel) : triggerLabel;
    const shortcutLabel = getShortcutLabel();

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
          <span className="mito-tab-dropdown-file-icon" aria-hidden>
            <FileIcon />
          </span>
          <span className="mito-tab-dropdown-filename">{triggerLabel}</span>
          {activePanel?.context.model.dirty && (
            <span className="mito-tab-dropdown-dirty-dot" title="Unsaved changes" />
          )}
          {notebooks.length > 0 && (
            <span className="mito-tab-dropdown-open-count">· {notebooks.length}</span>
          )}
          <span className="mito-tab-dropdown-kbd">{shortcutLabel}</span>
          <span className="mito-tab-dropdown-caret" aria-hidden>
            <ChevronIcon direction={this._isOpen ? 'up' : 'down'} />
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
      requestAnimationFrame(() => {
        this.node
          .querySelector<HTMLElement>('[data-active-option="true"]')
          ?.focus();
      });
    }
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
    requestAnimationFrame(() => {
      this.node
        .querySelector<HTMLElement>('[data-active-option="true"]')
        ?.focus();
    });
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
    if (event.key === 'Escape') {
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
  private readonly _leftCluster: TabDropdownWidget;
  private readonly _centerWidget: ModeSwitcherWidget;
  private readonly _rightCluster = new Panel();
  private readonly _notebookJupyterControls = new Toolbar();
  private readonly _notebookExtensions = new Toolbar();
  private readonly _notebookHero = new NotebookHeroWidget();
  private readonly _appActions: AppActionsWidget;

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
    this._appActions = new AppActionsWidget(app, documentManager, appDeployService, appManagerService);
    this._rightCluster.addWidget(this._notebookJupyterControls);
    this._rightCluster.addWidget(this._notebookExtensions);
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

  toggleTabDropdown(): void {
    this._leftCluster.toggleDropdown();
  }

  setMode(mode: NotebookViewMode): void {
    if (mode === 'App') {
      this._notebookJupyterControls.hide();
      this._notebookExtensions.hide();
      this._notebookHero.hide();
      this._appActions.show();
    } else if (mode === 'Notebook') {
      this._notebookJupyterControls.show();
      this._notebookExtensions.show();
      this._notebookHero.show();
      this._appActions.hide();
    } else {
      this._notebookJupyterControls.hide();
      this._notebookExtensions.hide();
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
}
