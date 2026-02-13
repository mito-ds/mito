/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import '../../../style/DocumentMode.css';
import '../../../style/NotebookToolbar.css';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ReactWidget } from '@jupyterlab/ui-components';
import { BoxLayout, Widget } from '@lumino/widgets';
import { Token } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import React from 'react';
import {
  setActiveCellByIDInNotebookPanel,
  scrollToCell
} from '../../utils/notebook';
import {
  IStreamlitPreviewManager,
  IFrameWidget,
  type StreamlitPreviewResponseSuccess,
  type StreamlitPreviewResponseError
} from '../AppPreview/StreamlitPreviewPlugin';
import { PlaceholderWidget } from '../AppPreview/PlaceholderWidget';
import { getNotebookIDAndSetIfNonexistant } from '../../utils/notebookMetadata';
import { logEvent } from '../../restAPI/RestAPI';
import { IAppDeployService } from '../AppDeploy/AppDeployPlugin';
import { IAppManagerService } from '../AppManager/ManageAppsPlugin';
import { COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT } from '../../commands';
import NotebookViewModeSwitcher from './NotebookViewModeSwitcher';
import { ModeToolbarWidget, MODE_TOOLBAR_CLASS } from './ModeToolbarWidget';

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
  getMode(): NotebookViewMode;
  setMode(mode: NotebookViewMode): void;
  readonly modeChanged: Signal<this, NotebookViewMode>;
  syncToCurrentNotebook(): void;
  openPreviewAndSwitchToAppMode(
    notebookPanel: NotebookPanel,
    createStreamlitAppPrompt?: string
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError>;
  editPreviewAndSwitchToAppMode(
    editPrompt: string,
    notebookPanel: NotebookPanel
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError>;
}

/**
 * Service that manages per-notebook view modes (Notebook / Document / App)
 * and handles in-place content swapping within each NotebookPanel tab.
 */
export class NotebookViewModeManager implements INotebookViewMode {
  /**
   * Per-notebook mode. Keyed by notebookPanel.id.
   */
  private _notebookModes = new Map<string, NotebookViewMode>();
  private _modeChanged = new Signal<this, NotebookViewMode>(this);
  private _notebookTracker: INotebookTracker;
  private _app: JupyterFrontEnd;
  private _streamlitPreviewManager: IStreamlitPreviewManager;
  private _appDeployService: IAppDeployService;
  private _appManagerService: IAppManagerService;
  private _dblclickHandler: ((event: MouseEvent) => void) | null = null;
  private _currentPanelForDblclick: NotebookPanel | null = null;

  /**
   * Track the current Streamlit process ID so we can stop it when leaving App mode.
   */
  private _activePreviewId: string | null = null;

  /**
   * Track the current iframe and placeholder widgets so we can dispose them.
   */
  private _activeIframe: IFrameWidget | null = null;
  private _activePlaceholder: PlaceholderWidget | null = null;

  constructor(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    streamlitPreviewManager: IStreamlitPreviewManager,
    appDeployService: IAppDeployService,
    appManagerService: IAppManagerService,
  ) {
    this._app = app;
    this._notebookTracker = notebookTracker;
    this._streamlitPreviewManager = streamlitPreviewManager;
    this._appDeployService = appDeployService;
    this._appManagerService = appManagerService;

    notebookTracker.currentChanged.connect(() => {
      this._onCurrentNotebookChanged();
    });
  }

  // -------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------

  getMode(): NotebookViewMode {
    const panel = this._notebookTracker.currentWidget;
    if (!panel) {
      return 'Notebook';
    }
    return this._notebookModes.get(panel.id) ?? 'Notebook';
  }

  setMode(mode: NotebookViewMode): void {
    const panel = this._notebookTracker.currentWidget;
    if (!panel) {
      return;
    }
    const currentMode = this._notebookModes.get(panel.id) ?? 'Notebook';
    if (currentMode === mode) {
      return;
    }
    this._notebookModes.set(panel.id, mode);
    this._applyMode(panel, mode);
    this._modeChanged.emit(mode);
  }

  get modeChanged(): Signal<this, NotebookViewMode> {
    return this._modeChanged;
  }

  syncToCurrentNotebook(): void {
    const panel = this._notebookTracker.currentWidget;
    if (!panel) {
      return;
    }
    const mode = this._notebookModes.get(panel.id) ?? 'Notebook';
    this._applyMode(panel, mode);
  }

  async openPreviewAndSwitchToAppMode(
    notebookPanel: NotebookPanel,
    createStreamlitAppPrompt?: string
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> {
    // Set the mode to App (this triggers the UI swap, shows placeholder)
    this._notebookModes.set(notebookPanel.id, 'App');
    this._applyAppModeUI(notebookPanel);
    this._modeChanged.emit('App');

    // Save the notebook first
    await notebookPanel.context.save();

    const notebookPath = notebookPanel.context.path;
    const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel);

    // Start the Streamlit process
    const result = await this._streamlitPreviewManager.startPreview(
      notebookPath,
      notebookID,
      createStreamlitAppPrompt
    );

    if (result.type === 'success') {
      void logEvent('opened_streamlit_app_preview');
      this._activePreviewId = result.id;
      this._swapPlaceholderForIframe(notebookPanel, result.url);
    } else {
      // Revert to Notebook mode on error
      this._notebookModes.set(notebookPanel.id, 'Notebook');
      this._applyMode(notebookPanel, 'Notebook');
      this._modeChanged.emit('Notebook');
    }

    return result;
  }

  async editPreviewAndSwitchToAppMode(
    editPrompt: string,
    notebookPanel: NotebookPanel
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> {
    // If not already in App mode, switch to it
    const currentMode = this._notebookModes.get(notebookPanel.id) ?? 'Notebook';
    if (currentMode !== 'App') {
      this._notebookModes.set(notebookPanel.id, 'App');
      this._applyAppModeUI(notebookPanel);
      this._modeChanged.emit('App');
    }

    // Save the notebook first
    await notebookPanel.context.save();

    const notebookPath = notebookPanel.context.path;
    const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel);

    const result = await this._streamlitPreviewManager.editPreview(
      notebookPath,
      notebookID,
      editPrompt
    );

    if (result.type === 'success') {
      this._activePreviewId = result.id;
      // If the iframe already exists, the Streamlit auto-refresh will handle it.
      // If not (we just switched to App mode), create the iframe.
      if (!this._activeIframe) {
        this._swapPlaceholderForIframe(notebookPanel, result.url);
      }
    } else {
      // Revert to Notebook mode on error
      this._notebookModes.set(notebookPanel.id, 'Notebook');
      this._applyMode(notebookPanel, 'Notebook');
      this._modeChanged.emit('Notebook');
    }

    return result;
  }

  // -------------------------------------------------------------------
  // Per-notebook setup
  // -------------------------------------------------------------------

  /**
   * Set up a NotebookPanel: add mode switcher to native toolbar
   * and app toolbar to contentHeader (hidden).
   */
  setupNotebookPanel(panel: NotebookPanel): void {
    this._addModeSwitcherToToolbar(panel);
    this._addModeToolbarToContentHeader(panel);

    // Clean up state when the panel is disposed
    panel.disposed.connect(() => {
      this._cleanupPanel(panel);
    });
  }

  // -------------------------------------------------------------------
  // Private: mode application
  // -------------------------------------------------------------------

  private _applyMode(panel: NotebookPanel, mode: NotebookViewMode): void {
    switch (mode) {
      case 'Notebook':
        this._applyNotebookMode(panel);
        break;
      case 'Document':
        this._applyDocumentMode(panel);
        break;
      case 'App':
        // App mode is handled by openPreviewAndSwitchToAppMode, not here.
        // This path is only for restoring App mode when switching tabs,
        // but since we kill the process on mode change, we revert to Notebook.
        // If the mode was somehow set to App without a process, revert.
        if (!this._activeIframe && !this._activePlaceholder) {
          this._notebookModes.set(panel.id, 'Notebook');
          this._applyNotebookMode(panel);
          this._modeChanged.emit('Notebook');
        }
        break;
    }
  }

  private _applyNotebookMode(panel: NotebookPanel): void {
    // Kill any running Streamlit process
    this._killActiveProcess();
    // Dispose iframe/placeholder
    this._disposeTransientWidgets();
    // Show native toolbar (includes third-party buttons, cell type, run, etc.)
    panel.toolbar.show();
    // Hide custom mode toolbar
    this._setModeToolbarVisible(panel, false);
    // Show notebook content
    panel.content.show();
    // Remove document-mode CSS
    panel.content.node.classList.remove(DOCUMENT_MODE_CSS_CLASS);
    // Update dblclick listener
    this._attachOrDetachDblclickListener(panel, false);
  }

  private _applyDocumentMode(panel: NotebookPanel): void {
    // Kill any running Streamlit process
    this._killActiveProcess();
    // Dispose iframe/placeholder
    this._disposeTransientWidgets();
    // Hide native toolbar (Run Cell, cell type, etc. are not relevant in Document mode)
    panel.toolbar.hide();
    // Show custom mode toolbar (mode switcher only, no app buttons since mode is Document)
    this._setModeToolbarVisible(panel, true);
    // Show notebook content
    panel.content.show();
    // Add document-mode CSS
    panel.content.node.classList.add(DOCUMENT_MODE_CSS_CLASS);
    // Attach dblclick listener
    this._attachOrDetachDblclickListener(panel, true);
  }

  /**
   * Apply the App mode UI: hide native toolbar, show app toolbar,
   * hide notebook content, show placeholder.
   * Does NOT start the Streamlit process -- that is done by
   * openPreviewAndSwitchToAppMode / editPreviewAndSwitchToAppMode.
   */
  private _applyAppModeUI(panel: NotebookPanel): void {
    // Remove document-mode CSS
    panel.content.node.classList.remove(DOCUMENT_MODE_CSS_CLASS);
    // Detach dblclick listener
    this._attachOrDetachDblclickListener(panel, false);
    // Hide native toolbar
    panel.toolbar.hide();
    // Show custom mode toolbar (mode switcher + app buttons since mode is App)
    this._setModeToolbarVisible(panel, true);
    // Hide notebook content
    panel.content.hide();
    // Show placeholder
    this._showPlaceholder(panel);
  }

  // -------------------------------------------------------------------
  // Private: transient widget management
  // -------------------------------------------------------------------

  private _showPlaceholder(panel: NotebookPanel): void {
    this._disposeTransientWidgets();
    const placeholder = new PlaceholderWidget();
    BoxLayout.setStretch(placeholder, 1);
    (panel.layout as BoxLayout).addWidget(placeholder);
    this._activePlaceholder = placeholder;
  }

  private _swapPlaceholderForIframe(panel: NotebookPanel, url: string): void {
    if (this._activePlaceholder) {
      this._activePlaceholder.dispose();
      this._activePlaceholder = null;
    }
    const iframe = new IFrameWidget(url);
    BoxLayout.setStretch(iframe, 1);
    (panel.layout as BoxLayout).addWidget(iframe);
    this._activeIframe = iframe;
  }

  private _disposeTransientWidgets(): void {
    if (this._activeIframe) {
      this._activeIframe.dispose();
      this._activeIframe = null;
    }
    if (this._activePlaceholder) {
      this._activePlaceholder.dispose();
      this._activePlaceholder = null;
    }
  }

  private _killActiveProcess(): void {
    if (this._activePreviewId) {
      void this._streamlitPreviewManager.stopPreview(this._activePreviewId);
      this._activePreviewId = null;
    }
  }

  // -------------------------------------------------------------------
  // Private: custom mode toolbar in contentHeader
  // -------------------------------------------------------------------

  private _addModeToolbarToContentHeader(panel: NotebookPanel): void {
    // Check if already added
    const existing = panel.contentHeader.node.querySelector(
      '.' + MODE_TOOLBAR_CLASS
    );
    if (existing) {
      return;
    }

    const modeToolbar = new ModeToolbarWidget(
      panel,
      (mode) => {
        if (mode === 'App') {
          void this.openPreviewAndSwitchToAppMode(panel);
        } else {
          this.setMode(mode);
        }
      },
      this._appDeployService,
      this._appManagerService,
      this._app,
    );
    modeToolbar.hide(); // hidden by default
    panel.contentHeader.addWidget(modeToolbar);
  }

  private _setModeToolbarVisible(panel: NotebookPanel, visible: boolean): void {
    for (const widget of panel.contentHeader.widgets) {
      if (widget.hasClass(MODE_TOOLBAR_CLASS)) {
        if (visible) {
          const mode = this._notebookModes.get(panel.id) ?? 'Notebook';
          (widget as ModeToolbarWidget).setMode(mode);
          widget.show();
          // Force a React re-render after showing to fix potential sizing issues
          (widget as ModeToolbarWidget).update();
        } else {
          widget.hide();
        }
        break;
      }
    }
  }

  // -------------------------------------------------------------------
  // Private: mode switcher in native toolbar
  // -------------------------------------------------------------------

  private _addModeSwitcherToToolbar(panel: NotebookPanel): void {
    const toolbar = panel.toolbar;
    if (!toolbar) {
      return;
    }
    if (toolbar.node.querySelector('.mito-notebook-view-mode-switcher-widget')) {
      return;
    }
    // Ensure our toolbar layout CSS applies (flex: spacer + right-aligned buttons)
    toolbar.addClass('jp-Notebook-toolbar');
    const widget = new ModeSwitcherToolbarWidget(panel, this);
    // Insert at position 0 so the mode switcher is always the first (leftmost) item
    toolbar.insertItem(0, MODE_SWITCHER_TOOLBAR_ID, widget);
    // Spacer pushes all other toolbar items to the right: [Switcher] [space] [toolbar buttons] [run cell]
    // Adding jp-Toolbar-spacer so ReactiveToolbar's resize logic counts this as ~2px
    // (instead of measuring clientWidth), preventing items from collapsing into the popup.
    const spacer = new Widget();
    spacer.addClass('mito-notebook-toolbar-spacer');
    spacer.addClass('jp-Toolbar-spacer');
    toolbar.insertItem(1, TOOLBAR_SPACER_ID, spacer);
  }

  // -------------------------------------------------------------------
  // Private: current notebook changed
  // -------------------------------------------------------------------

  private _onCurrentNotebookChanged(): void {
    const panel = this._notebookTracker.currentWidget;
    if (!panel) {
      return;
    }
    const mode = this._notebookModes.get(panel.id) ?? 'Notebook';
    // Emit so toolbar widgets update
    this._modeChanged.emit(mode);
    // Apply document-mode class and dblclick listener for the new panel
    this._updateDocumentModeClassForPanel(panel, mode);
    this._attachOrDetachDblclickListener(panel, mode === 'Document');
  }

  private _updateDocumentModeClassForPanel(
    panel: NotebookPanel,
    mode: NotebookViewMode
  ): void {
    if (!panel?.content?.node) {
      return;
    }
    if (mode === 'Document') {
      panel.content.node.classList.add(DOCUMENT_MODE_CSS_CLASS);
    } else {
      panel.content.node.classList.remove(DOCUMENT_MODE_CSS_CLASS);
    }
  }

  // -------------------------------------------------------------------
  // Private: document-mode dblclick
  // -------------------------------------------------------------------

  private _attachOrDetachDblclickListener(
    panel: NotebookPanel,
    attach: boolean
  ): void {
    // Remove existing listener
    if (this._dblclickHandler && this._currentPanelForDblclick?.content?.node) {
      this._currentPanelForDblclick.content.node.removeEventListener(
        'dblclick',
        this._dblclickHandler
      );
      this._dblclickHandler = null;
      this._currentPanelForDblclick = null;
    }

    if (!attach || !panel?.content?.node) {
      return;
    }

    this._dblclickHandler = (event: MouseEvent) => {
      this._handleDocumentModeDblclick(panel, event);
    };
    this._currentPanelForDblclick = panel;
    panel.content.node.addEventListener('dblclick', this._dblclickHandler);
  }

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

  // -------------------------------------------------------------------
  // Private: cleanup
  // -------------------------------------------------------------------

  private _cleanupPanel(panel: NotebookPanel): void {
    const mode = this._notebookModes.get(panel.id);
    if (mode === 'App') {
      this._killActiveProcess();
      this._disposeTransientWidgets();
    }
    this._notebookModes.delete(panel.id);
  }
}

// -------------------------------------------------------------------
// Toolbar widget: mode switcher in the native notebook toolbar
// -------------------------------------------------------------------

const MODE_SWITCHER_TOOLBAR_ID = 'mito-notebook-view-mode-switcher';
const TOOLBAR_SPACER_ID = 'mito-notebook-toolbar-spacer';

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

// -------------------------------------------------------------------
// Plugin definition
// -------------------------------------------------------------------

const NotebookViewModePlugin: JupyterFrontEndPlugin<INotebookViewMode> = {
  id: 'mito-ai:notebook-view-mode',
  description: 'Notebook / Document / App view mode with in-place content swapping',
  autoStart: true,
  requires: [
    INotebookTracker,
    IStreamlitPreviewManager,
    IAppDeployService,
    IAppManagerService,
    ICommandPalette,
  ],
  provides: INotebookViewMode,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    streamlitPreviewManager: IStreamlitPreviewManager,
    appDeployService: IAppDeployService,
    appManagerService: IAppManagerService,
    palette: ICommandPalette,
  ): INotebookViewMode => {
    console.log('mito-ai: NotebookViewModePlugin activated');
    const manager = new NotebookViewModeManager(
      app,
      notebookTracker,
      streamlitPreviewManager,
      appDeployService,
      appManagerService,
    );

    // Set up existing notebook panels
    notebookTracker.forEach((panel) => {
      manager.setupNotebookPanel(panel);
    });
    notebookTracker.widgetAdded.connect((_, panel) => {
      manager.setupNotebookPanel(panel);
    });

    // Register the "Preview as Streamlit" command
    app.commands.addCommand(COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT, {
      label: 'Preview as Streamlit',
      caption: 'Convert current notebook to Streamlit app and preview it',
      execute: async () => {
        const currentWidget = notebookTracker.currentWidget;
        if (currentWidget) {
          await manager.openPreviewAndSwitchToAppMode(currentWidget);
        } else {
          console.error('No notebook is currently active');
        }
      }
    });
    palette.addItem({
      command: COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT,
      category: 'Mito AI'
    });

    manager.syncToCurrentNotebook();
    return manager;
  }
};

export default NotebookViewModePlugin;
