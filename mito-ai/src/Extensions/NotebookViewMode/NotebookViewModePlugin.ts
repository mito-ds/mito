/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import '../../../style/DocumentMode.css';
import { JupyterFrontEnd, JupyterFrontEndPlugin, ILabShell } from '@jupyterlab/application';
import { createToolbarFactory, IToolbarWidgetRegistry, setToolbar } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { BoxLayout, Widget } from '@lumino/widgets';
import { Token } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
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
import {
  COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT,
  COMMAND_MITO_AI_TOGGLE_TAB_DROPDOWN
} from '../../commands';
import { MitoToolbarWidget } from './MitoToolbarWidget';
import { DocumentReactiveRunner } from './documentReactiveRunner';
import { DocumentModeViewCodeButtons } from './documentModeViewCodeButtons';

export type NotebookViewMode = 'Notebook' | 'Document' | 'App';

export const DOCUMENT_MODE_CSS_CLASS = 'jp-mod-mito-document-mode';
const MITO_TOOLBAR_PLUGIN_ID = 'mito_ai:toolbar-buttons';

export const INotebookViewMode = new Token<INotebookViewMode>(
  'mito-ai:INotebookViewMode',
  'Token for the NotebookViewMode service that manages Notebook/Document/App view mode'
);

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

export class NotebookViewModeManager implements INotebookViewMode {
  private _mode: NotebookViewMode = 'Notebook';
  private _modeChanged = new Signal<this, NotebookViewMode>(this);
  private _notebookTracker: INotebookTracker;
  private _streamlitPreviewManager: IStreamlitPreviewManager;
  private _activePreviewId: string | null = null;
  private _activeIframe: IFrameWidget | null = null;
  private _activePlaceholder: PlaceholderWidget | null = null;
  // Guards against async preview responses that return after the user leaves App mode.
  // Without this, a late success response can still mount an iframe beneath notebook/document UI.
  private _appModeRequestToken = 0;
  private _documentReactiveRunner: DocumentReactiveRunner | null = null;
  private _documentModeViewCodeButtons: DocumentModeViewCodeButtons | null = null;
  // Capture-phase handler so dblclicks never reach Jupyter cell widgets (e.g. markdown edit).
  // In document mode, users tend to double click around the document without intending to edit the markdown code.
  private _documentCellDblclickGuard: ((event: MouseEvent) => void) | null = null;
  private _documentCellDblclickGuardPanel: NotebookPanel | null = null;

  constructor(
    notebookTracker: INotebookTracker,
    streamlitPreviewManager: IStreamlitPreviewManager
  ) {
    this._notebookTracker = notebookTracker;
    this._streamlitPreviewManager = streamlitPreviewManager;

    notebookTracker.currentChanged.connect(() => {
      this._onCurrentNotebookChanged();
    });
  }

  getMode(): NotebookViewMode {
    return this._mode;
  }

  setMode(mode: NotebookViewMode): void {
    const panel = this._notebookTracker.currentWidget;
    if (!panel || this._mode === mode) {
      return;
    }
    if (mode !== 'App') {
      this._invalidateAppModeRequests();
    }
    this._mode = mode;
    this._applyMode(panel, mode);
    this._modeChanged.emit(mode);
  }

  get modeChanged(): Signal<this, NotebookViewMode> {
    return this._modeChanged;
  }

  syncToCurrentNotebook(): void {
    const panel = this._notebookTracker.currentWidget;
    if (!panel) {
      this._mode = 'Notebook';
      this._modeChanged.emit(this._mode);
      return;
    }
    this._mode = 'Notebook';
    this._applyNotebookMode(panel);
    this._modeChanged.emit(this._mode);
  }

  async openPreviewAndSwitchToAppMode(
    notebookPanel: NotebookPanel,
    createStreamlitAppPrompt?: string
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> {
    const requestToken = this._beginAppModeRequest();
    this._mode = 'App';
    this._applyAppModeUI(notebookPanel);
    this._modeChanged.emit('App');

    await notebookPanel.context.save();
    const notebookPath = notebookPanel.context.path;
    const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel);
    const result = await this._streamlitPreviewManager.startPreview(
      notebookPath,
      notebookID,
      createStreamlitAppPrompt
    );

    if (result.type === 'success') {
      if (!this._isCurrentAppModeRequest(requestToken, notebookPanel)) {
        void this._streamlitPreviewManager.stopPreview(result.id);
        return result;
      }
      void logEvent('opened_streamlit_app_preview');
      this._activePreviewId = result.id;
      this._swapPlaceholderForIframe(notebookPanel, result.url);
    } else {
      if (!this._isCurrentAppModeRequest(requestToken, notebookPanel)) {
        return result;
      }
      this._mode = 'Notebook';
      this._applyNotebookMode(notebookPanel);
      this._modeChanged.emit('Notebook');
    }

    return result;
  }

  async editPreviewAndSwitchToAppMode(
    editPrompt: string,
    notebookPanel: NotebookPanel
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> {
    const requestToken = this._beginAppModeRequest();
    if (this._mode !== 'App') {
      this._mode = 'App';
      this._applyAppModeUI(notebookPanel);
      this._modeChanged.emit('App');
    }

    await notebookPanel.context.save();
    const notebookPath = notebookPanel.context.path;
    const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel);
    const result = await this._streamlitPreviewManager.editPreview(
      notebookPath,
      notebookID,
      editPrompt
    );

    if (result.type === 'success') {
      if (!this._isCurrentAppModeRequest(requestToken, notebookPanel)) {
        void this._streamlitPreviewManager.stopPreview(result.id);
        return result;
      }
      this._activePreviewId = result.id;
      if (!this._activeIframe) {
        this._swapPlaceholderForIframe(notebookPanel, result.url);
      }
    } else {
      if (!this._isCurrentAppModeRequest(requestToken, notebookPanel)) {
        return result;
      }
      this._mode = 'Notebook';
      this._applyNotebookMode(notebookPanel);
      this._modeChanged.emit('Notebook');
    }

    return result;
  }

  setupNotebookPanel(panel: NotebookPanel): void {
    panel.toolbar.hide();
    panel.disposed.connect(() => {
      this._cleanupPanel(panel);
    });
  }

  private _applyMode(panel: NotebookPanel, mode: NotebookViewMode): void {
    if (mode === 'Notebook') {
      this._applyNotebookMode(panel);
      return;
    }

    if (mode === 'Document') {
      this._applyDocumentMode(panel);
      return;
    }

    this._applyAppModeUI(panel);
  }

  private _applyNotebookMode(panel: NotebookPanel): void {
    this._disposeDocumentReactiveRunner();
    this._disposeDocumentModeCellDblclickGuard();
    this._killActiveProcess();
    this._disposeTransientWidgets();
    panel.toolbar.hide();
    panel.content.show();
    panel.content.node.classList.remove(DOCUMENT_MODE_CSS_CLASS);
    this._disposeDocumentModeViewCodeButtons();
  }

  private _applyDocumentMode(panel: NotebookPanel): void {
    this._killActiveProcess();
    this._disposeTransientWidgets();
    this._expandCollapsedOutputs(panel);
    panel.toolbar.hide();
    panel.content.show();
    panel.content.node.classList.add(DOCUMENT_MODE_CSS_CLASS);
    this._attachDocumentModeCellDblclickGuard(panel);
    this._disposeDocumentModeViewCodeButtons();
    this._documentModeViewCodeButtons = new DocumentModeViewCodeButtons(panel, (cellId: string) => {
      this.setMode('Notebook');
      setActiveCellByIDInNotebookPanel(panel, cellId);
      scrollToCell(panel, cellId, undefined, 'center');
    });
    this._documentModeViewCodeButtons.attach();
    this._disposeDocumentReactiveRunner();
    this._documentReactiveRunner = new DocumentReactiveRunner(panel, () => this._mode === 'Document');
    this._documentReactiveRunner.attach();
  }

  private _expandCollapsedOutputs(panel: NotebookPanel): void {
    const collapsedOutputToggles = panel.content.node.querySelectorAll<HTMLElement>(
      '.jp-OutputArea .jp-OutputArea-promptOverlay[title*="Expand"], .jp-OutputArea .jp-mod-collapsed'
    );

    collapsedOutputToggles.forEach((toggle) => {
      toggle.click();
    });
  }

  private _applyAppModeUI(panel: NotebookPanel): void {
    this._disposeDocumentReactiveRunner();
    this._disposeDocumentModeCellDblclickGuard();
    panel.content.node.classList.remove(DOCUMENT_MODE_CSS_CLASS);
    this._disposeDocumentModeViewCodeButtons();
    panel.toolbar.hide();
    panel.content.hide();
    this._showPlaceholder(panel);
  }

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

  private _onCurrentNotebookChanged(): void {
    const panel = this._notebookTracker.currentWidget;
    if (!panel) {
      this._invalidateAppModeRequests();
      this._killActiveProcess();
      this._disposeTransientWidgets();
      this._mode = 'Notebook';
      this._modeChanged.emit(this._mode);
      return;
    }

    this._mode = 'Notebook';
    this._applyNotebookMode(panel);
    this._modeChanged.emit(this._mode);
  }

  private _disposeDocumentModeViewCodeButtons(): void {
    if (this._documentModeViewCodeButtons) {
      this._documentModeViewCodeButtons.dispose();
      this._documentModeViewCodeButtons = null;
    }
  }

  private _disposeDocumentModeCellDblclickGuard(): void {
    if (this._documentCellDblclickGuard) {
      window.removeEventListener('dblclick', this._documentCellDblclickGuard, true);
    }
    this._documentCellDblclickGuard = null;
    this._documentCellDblclickGuardPanel = null;
  }

  /**
   * In Document mode, swallow double-clicks on the active notebook before they reach
   * JupyterLab cell widgets (e.g. markdown entering edit mode). Uses window capture so
   * we run before per-node handlers registered earlier on the notebook subtree.
   */
  private _attachDocumentModeCellDblclickGuard(panel: NotebookPanel): void {
    this._disposeDocumentModeCellDblclickGuard();
    this._documentCellDblclickGuardPanel = panel;
    this._documentCellDblclickGuard = (event: MouseEvent): void => {
      if (this._mode !== 'Document') {
        return;
      }
      const active = this._notebookTracker.currentWidget;
      if (!active?.content?.node || active !== panel) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node) || !active.content.node.contains(target)) {
        return;
      }
      if (!(target instanceof Element) || !target.closest('.jp-Cell')) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener('dblclick', this._documentCellDblclickGuard, true);
  }

  private _cleanupPanel(panel: NotebookPanel): void {
    if (this._documentReactiveRunner?.panel === panel) {
      this._disposeDocumentReactiveRunner();
    }
    if (this._documentModeViewCodeButtons?.panel === panel) {
      this._disposeDocumentModeViewCodeButtons();
    }
    if (this._documentCellDblclickGuardPanel === panel) {
      this._disposeDocumentModeCellDblclickGuard();
    }
    if (
      this._mode === 'App' &&
      (this._notebookTracker.currentWidget === panel || !this._notebookTracker.currentWidget)
    ) {
      this._killActiveProcess();
      this._disposeTransientWidgets();
    }
  }

  private _disposeDocumentReactiveRunner(): void {
    if (this._documentReactiveRunner) {
      this._documentReactiveRunner.dispose();
      this._documentReactiveRunner = null;
    }
  }

  private _beginAppModeRequest(): number {
    this._appModeRequestToken += 1;
    return this._appModeRequestToken;
  }

  private _invalidateAppModeRequests(): void {
    this._appModeRequestToken += 1;
  }

  private _isCurrentAppModeRequest(requestToken: number, panel: NotebookPanel): boolean {
    return (
      requestToken === this._appModeRequestToken &&
      this._mode === 'App' &&
      this._notebookTracker.currentWidget === panel
    );
  }
}

const NotebookViewModePlugin: JupyterFrontEndPlugin<INotebookViewMode> = {
  id: 'mito-ai:notebook-view-mode',
  description: 'Notebook / Document / App view mode with top-level toolbar',
  autoStart: true,
  requires: [
    ILabShell,
    INotebookTracker,
    IToolbarWidgetRegistry,
    ISettingRegistry,
    IStreamlitPreviewManager,
    IAppDeployService,
    IAppManagerService,
    IDocumentManager
  ] as JupyterFrontEndPlugin<INotebookViewMode>['requires'],
  optional: [ITranslator],
  provides: INotebookViewMode,
  activate: (
    app: JupyterFrontEnd,
    shell: ILabShell,
    notebookTracker: INotebookTracker,
    toolbarRegistry: IToolbarWidgetRegistry,
    settingsRegistry: ISettingRegistry,
    streamlitPreviewManager: IStreamlitPreviewManager,
    appDeployService: IAppDeployService,
    appManagerService: IAppManagerService,
    documentManager: IDocumentManager,
    translator: ITranslator | null
  ): INotebookViewMode => {
    const manager = new NotebookViewModeManager(
      notebookTracker,
      streamlitPreviewManager
    );
    const getActiveNotebookPanel = (): NotebookPanel | null => {
      const widget = shell.currentWidget;
      return widget instanceof NotebookPanel ? widget : null;
    };
    const getCurrentMainAreaWidget = (): Widget | null => {
      const mainAreaWidgets = Array.from(shell.widgets('main'));
      return (
        shell.currentWidget ??
        mainAreaWidgets.find(widget => widget.isVisible && !widget.isHidden) ??
        mainAreaWidgets.find(
          widget => widget.title.label === 'Launcher' || widget.id.toLowerCase().includes('launcher')
        ) ??
        mainAreaWidgets[0] ??
        null
      );
    };

    notebookTracker.forEach((panel) => {
      manager.setupNotebookPanel(panel);
    });
    notebookTracker.widgetAdded.connect((_, panel) => {
      manager.setupNotebookPanel(panel);
    });

    const toolbarWidget = new MitoToolbarWidget(
      manager,
      getActiveNotebookPanel,
      notebookTracker,
      app,
      toolbarRegistry,
      getCurrentMainAreaWidget,
      documentManager,
      appDeployService,
      appManagerService
    );
    shell.add(toolbarWidget, 'top', { rank: 150 });

    const notebookToolbarFactory = createToolbarFactory(
      toolbarRegistry,
      settingsRegistry,
      'Notebook',
      MITO_TOOLBAR_PLUGIN_ID,
      translator ?? nullTranslator
    );

    const bindToolbarToPanel = (panel: NotebookPanel | null): void => {
      toolbarWidget.setActivePanel(panel);
      toolbarWidget.prepareNotebookExtensionToolbarForRebind();
      if (!panel) {
        toolbarWidget.notebookExtensionsToolbar.hide();
        return;
      }
      panel.toolbar.hide();
      toolbarWidget.notebookExtensionsToolbar.show();
      setToolbar(
        panel,
        notebookToolbarFactory,
        toolbarWidget.notebookExtensionsToolbar
      );
      toolbarWidget.syncNotebookExtensionToolbar(panel);
      toolbarWidget.setMode(manager.getMode());
    };
    let pendingToolbarBindPanel: NotebookPanel | null = null;
    let hasPendingToolbarBind = false;
    // Tab switches can trigger multiple cascading signals in the same tick.
    // Coalesce them so we only rebind once, using the latest active panel.
    const scheduleToolbarBind = (panel: NotebookPanel | null): void => {
      pendingToolbarBindPanel = panel;
      if (hasPendingToolbarBind) {
        return;
      }
      hasPendingToolbarBind = true;
      void Promise.resolve().then(() => {
        hasPendingToolbarBind = false;
        bindToolbarToPanel(pendingToolbarBindPanel);
      });
    };

    notebookTracker.currentChanged.connect((_, panel) => {
      scheduleToolbarBind(panel);
    });

    shell.currentChanged.connect(() => {
      const panel = getActiveNotebookPanel();
      if (!panel) {
        toolbarWidget.setMode('Notebook');
        scheduleToolbarBind(null);
        return;
      }
      manager.syncToCurrentNotebook();
    });
    shell.layoutModified.connect(() => {
      toolbarWidget.refreshCurrentWidgetState(getActiveNotebookPanel());
    });

    manager.modeChanged.connect((_, mode) => {
      toolbarWidget.setMode(mode);
      scheduleToolbarBind(getActiveNotebookPanel());
    });

    app.commands.addCommand(COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT, {
      label: 'Preview as Streamlit',
      caption: 'Convert current notebook to Streamlit app and preview it',
      execute: async () => {
        const currentWidget = notebookTracker.currentWidget;
        if (currentWidget) {
          await manager.openPreviewAndSwitchToAppMode(currentWidget);
        }
      }
    });

    app.commands.addCommand(COMMAND_MITO_AI_TOGGLE_TAB_DROPDOWN, {
      label: 'Toggle Notebook Tab Dropdown',
      caption: 'Show or hide the notebook tab dropdown in the Mito toolbar',
      execute: () => {
        toolbarWidget.toggleTabDropdown();
      }
    });
    app.commands.addKeyBinding({
      command: COMMAND_MITO_AI_TOGGLE_TAB_DROPDOWN,
      keys: ['Accel K'],
      selector: '.jp-LabShell',
      preventDefault: true
    });

    bindToolbarToPanel(getActiveNotebookPanel());
    if (getActiveNotebookPanel()) {
      manager.syncToCurrentNotebook();
    } else {
      toolbarWidget.setMode('Notebook');
    }
    return manager;
  }
};

export default NotebookViewModePlugin;
