/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import '../../../style/DocumentMode.css';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ReactWidget } from '@jupyterlab/ui-components';
import { Token } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import React from 'react';
import {
  setActiveCellByIDInNotebookPanel,
  scrollToCell
} from '../../utils/notebook';
import {
  IStreamlitPreviewManager,
  type StreamlitPreviewResponseSuccess,
  type StreamlitPreviewResponseError
} from '../AppPreview/StreamlitPreviewPlugin';
import NotebookViewModeSwitcher from './NotebookViewModeSwitcher';

export type NotebookViewMode = 'Notebook' | 'Document' | 'App';

export const DOCUMENT_MODE_CSS_CLASS = 'jp-mod-mito-document-mode';

/**
 * Token for the NotebookViewMode service.
 */
export const INotebookViewMode = new Token<INotebookViewMode>(
  'mito-ai:INotebookViewMode',
  'Token for the NotebookViewMode service that manages Notebook/Document/App view mode'
);

/**
 * Interface for the NotebookViewMode service.
 */
export interface INotebookViewMode {
  /**
   * Current view mode.
   */
  getMode(): NotebookViewMode;

  /**
   * Set view mode and notify listeners.
   */
  setMode(mode: NotebookViewMode): void;

  /**
   * Signal emitted when the view mode changes.
   */
  readonly modeChanged: Signal<this, NotebookViewMode>;

  /**
   * Sync document-mode class and dblclick listener to the current notebook.
   * Called by the plugin on activate when a notebook may already be open.
   */
  syncToCurrentNotebook(): void;

  /**
   * Open Streamlit app preview, activate the app tab, and set view mode to App.
   */
  openPreviewAndSwitchToAppMode(
    notebookPanel: NotebookPanel,
    createStreamlitAppPrompt?: string
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError>;

  /**
   * Edit the existing Streamlit app preview, then activate the app tab and set view mode to App.
   */
  editPreviewAndSwitchToAppMode(
    editPrompt: string,
    notebookPanel: NotebookPanel
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError>;
}

/**
 * Service that holds the current notebook view mode and applies Document mode
 * (hide code cells, show outputs + markdown; double-click output to return to Notebook).
 */
class NotebookViewModeManager implements INotebookViewMode {
  private _mode: NotebookViewMode = 'Notebook';
  private _modeChanged = new Signal<this, NotebookViewMode>(this);
  private _notebookTracker: INotebookTracker;
  private _app: JupyterFrontEnd;
  private _streamlitPreviewManager: IStreamlitPreviewManager;
  private _dblclickHandler: ((event: MouseEvent) => void) | null = null;
  private _currentPanelForDblclick: NotebookPanel | null = null;

  constructor(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    streamlitPreviewManager: IStreamlitPreviewManager
  ) {
    this._app = app;
    this._notebookTracker = notebookTracker;
    this._streamlitPreviewManager = streamlitPreviewManager;

    notebookTracker.currentChanged.connect(() => {
      this._syncToCurrentNotebook();
    });
  }

  async openPreviewAndSwitchToAppMode(
    notebookPanel: NotebookPanel,
    createStreamlitAppPrompt?: string
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> {
    this.setMode('App');
    const result = await this._streamlitPreviewManager.openAppPreview(
      this._app,
      notebookPanel,
      createStreamlitAppPrompt,
      { addAsMainTab: true }
    );
    if (result.type === 'success') {
      const preview = this._streamlitPreviewManager.getCurrentPreview();
      if (preview?.id) {
        this._app.shell.activateById(preview.id);
      }
    } else {
      this.setMode('Notebook');
    }
    return result;
  }

  async editPreviewAndSwitchToAppMode(
    editPrompt: string,
    notebookPanel: NotebookPanel
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> {
    this.setMode('App');
    const result = await this._streamlitPreviewManager.editExistingPreview(
      editPrompt,
      notebookPanel
    );
    if (result.type === 'success') {
      const preview = this._streamlitPreviewManager.getCurrentPreview();
      if (preview?.id) {
        this._app.shell.activateById(preview.id);
      }
    } else {
      this.setMode('Notebook');
    }
    return result;
  }

  /**
   * Sync document-mode class and dblclick listener to the current notebook.
   */
  syncToCurrentNotebook(): void {
    this._updateDocumentModeClassForCurrentNotebook();
    this._attachOrDetachDblclickListener();
  }

  private _syncToCurrentNotebook(): void {
    this.syncToCurrentNotebook();
  }

  getMode(): NotebookViewMode {
    return this._mode;
  }

  setMode(mode: NotebookViewMode): void {
    if (this._mode === mode) {
      return;
    }
    this._mode = mode;
    this._modeChanged.emit(mode);
    this._syncToCurrentNotebook();
  }

  get modeChanged(): Signal<this, NotebookViewMode> {
    return this._modeChanged;
  }

  /**
   * Add or remove the document-mode CSS class on the current notebook's content node.
   */
  private _updateDocumentModeClassForCurrentNotebook(): void {
    const panel = this._notebookTracker.currentWidget;
    if (!panel?.content?.node) {
      return;
    }
    const node = panel.content.node;
    if (this._mode === 'Document') {
      node.classList.add(DOCUMENT_MODE_CSS_CLASS);
    } else {
      node.classList.remove(DOCUMENT_MODE_CSS_CLASS);
    }
  }

  /**
   * When in Document mode, attach a delegated dblclick listener on the notebook content.
   * When not in Document mode, remove it.
   */
  private _attachOrDetachDblclickListener(): void {
    const panel = this._notebookTracker.currentWidget;

    if (this._dblclickHandler && this._currentPanelForDblclick?.content?.node) {
      this._currentPanelForDblclick.content.node.removeEventListener(
        'dblclick',
        this._dblclickHandler
      );
      this._dblclickHandler = null;
      this._currentPanelForDblclick = null;
    }

    if (this._mode !== 'Document' || !panel?.content?.node) {
      return;
    }

    this._dblclickHandler = (event: MouseEvent) => {
      this._handleDocumentModeDblclick(panel, event);
    };
    this._currentPanelForDblclick = panel;
    panel.content.node.addEventListener('dblclick', this._dblclickHandler);
  }

  /**
   * On double-click in Document mode: if the target is inside a cell's output area,
   * switch to Notebook mode and scroll to that cell.
   */
  private _handleDocumentModeDblclick(
    notebookPanel: NotebookPanel,
    event: MouseEvent
  ): void {
    const target = event.target as Node;
    if (!target || !notebookPanel.content?.widgets) {
      return;
    }

    const cellWidget = notebookPanel.content.widgets.find((w) =>
      w.node.contains(target)
    );
    if (!cellWidget) {
      return;
    }

    const outputArea = cellWidget.node.querySelector('.jp-OutputArea');
    if (!outputArea || !outputArea.contains(target)) {
      return;
    }

    const cellId = cellWidget.model.id;
    this.setMode('Notebook');
    setActiveCellByIDInNotebookPanel(notebookPanel, cellId);
    scrollToCell(notebookPanel, cellId, undefined, 'center');
  }
}

const MODE_SWITCHER_TOOLBAR_ID = 'mito-notebook-view-mode-switcher';

/**
 * Toolbar widget that renders the Notebook | Document | App mode switcher.
 */
class ModeSwitcherToolbarWidget extends ReactWidget {
  constructor(
    private readonly notebookPanel: NotebookPanel,
    private readonly viewMode: INotebookViewMode
  ) {
    super();
    this.addClass('mito-notebook-view-mode-switcher-widget');
    this.viewMode.modeChanged.connect(() => {
      this.update();
    });
  }

  render(): JSX.Element {
    return React.createElement(NotebookViewModeSwitcher, {
      mode: this.viewMode.getMode(),
      onModeChange: (mode) => {
        if (mode === 'App') {
          void this.viewMode.openPreviewAndSwitchToAppMode(this.notebookPanel);
        } else {
          this.viewMode.setMode(mode);
        }
      }
    });
  }
}

function addModeSwitcherToToolbar(
  notebookPanel: NotebookPanel,
  viewMode: INotebookViewMode
): void {
  const toolbar = notebookPanel.toolbar;
  if (!toolbar) {
    return;
  }
  if (toolbar.node.querySelector('.mito-notebook-view-mode-switcher-widget')) {
    return;
  }
  const widget = new ModeSwitcherToolbarWidget(notebookPanel, viewMode);
  try {
    toolbar.insertAfter('spacer', MODE_SWITCHER_TOOLBAR_ID, widget);
  } catch {
    toolbar.addItem(MODE_SWITCHER_TOOLBAR_ID, widget);
  }
}

const NotebookViewModePlugin: JupyterFrontEndPlugin<INotebookViewMode> = {
  id: 'mito-ai:notebook-view-mode',
  description: 'Notebook / Document / App view mode (theme-agnostic)',
  autoStart: true,
  requires: [INotebookTracker, IStreamlitPreviewManager],
  provides: INotebookViewMode,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    streamlitPreviewManager: IStreamlitPreviewManager
  ): INotebookViewMode => {
    console.log('mito-ai: NotebookViewModePlugin activated');
    const manager = new NotebookViewModeManager(
      app,
      notebookTracker,
      streamlitPreviewManager
    );
    manager.syncToCurrentNotebook();

    notebookTracker.forEach((panel) => {
      addModeSwitcherToToolbar(panel, manager);
    });
    notebookTracker.widgetAdded.connect((_, panel) => {
      addModeSwitcherToToolbar(panel, manager);
    });

    return manager;
  }
};

export default NotebookViewModePlugin;
