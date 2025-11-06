/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ICommandPalette, ToolbarButton } from '@jupyterlab/apputils';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { Token } from '@lumino/coreutils';
import { logEvent, stopStreamlitPreview } from '../../restAPI/RestAPI';
import { deployStreamlitApp } from '../AppDeploy/DeployStreamlitApp';
import { IAppDeployService } from '../AppDeploy/AppDeployPlugin';
import { IAppManagerService } from '../AppManager/ManageAppsPlugin';
import { COMMAND_MITO_AI_BETA_MODE_ENABLED, COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT } from '../../commands';
import { DeployLabIcon, EditLabIcon, ResetCircleLabIcon } from '../../icons';
import '../../../style/StreamlitPreviewPlugin.css';
import { getAppPreviewNameFromNotebookPanel, showRecreateAppConfirmation, startStreamlitPreviewAndNotify } from './utils';
import { showUpdateAppDropdown } from './UpdateAppDropdown';
import { getNotebookIDAndSetIfNonexistant } from '../../utils/notebookMetadata';


/**
 * The token for the StreamlitPreview service.
 */
export const IStreamlitPreviewManager = new Token<IStreamlitPreviewManager>(
  'mito-ai:IStreamlitPreviewManager',
  'Token for the StreamlitPreview service that manages app previews'
);

/**
 * Interface for the streamlit preview response.
 */
export type StreamlitPreviewResponseSuccess = {
  type: 'success'
  id: string;
  port: number;
  url: string;
}

export type StreamlitPreviewResponseError = {
  type: 'error',
  message: string
}

/**
 * Interface for the StreamlitPreview service.
 */
export interface IStreamlitPreviewManager {
  /**
   * Create a new Streamlit app preview, replacing any existing preview.
   */
  openAppPreview(
    app: JupyterFrontEnd,
    notebookPanel: NotebookPanel
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError>;

  /**
   * Edit the existing Streamlit app preview by updating the app.py file.
   */
  editExistingPreview(
    editPrompt: string,
    notebookPanel: NotebookPanel
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError>;

  /**
   * Close the current preview if one exists.
   */
  closeCurrentPreview(): void;

  /**
   * Get the current preview widget.
   */
  getCurrentPreview(): MainAreaWidget | null;
}

/**
 * Simple HTML widget for displaying iframe content.
 */
class IFrameWidget extends Widget {
  constructor(url: string) {
    super();
    this.addClass('jp-iframe-widget');

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    this.node.appendChild(iframe);
  }

  setUrl(url: string): void {
    const iframe = this.node.querySelector('iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = url;
    }
  }
}

/**
 * Manages Streamlit app previews with a single-preview policy.
 * Ensures only one preview can be open at a time.
 */
class StreamlitAppPreviewManager implements IStreamlitPreviewManager {
  private currentPreview: MainAreaWidget | null = null;
  private appDeployService: IAppDeployService;
  private appManagerService: IAppManagerService;

  constructor(appDeployService: IAppDeployService, appManagerService: IAppManagerService) {
    this.appDeployService = appDeployService;
    this.appManagerService = appManagerService;
  }

  /**
   * Create a new Streamlit app preview, replacing any existing preview.
   */
  async openAppPreview(
    app: JupyterFrontEnd,
    notebookPanel: NotebookPanel,
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> {
    
    // If the user has a different app open, we first close that one
    if (!this.isCurrentPreivewForCurrentNotebook(notebookPanel)) {
      this.closeCurrentPreview();
    }
    
    // First save the notebook to ensure the app is up to date
    await notebookPanel.context.save();

    const notebookPath = notebookPanel.context.path;
    const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel)
    const streamlitPreviewResponse = await startStreamlitPreviewAndNotify(notebookPath, notebookID);

    if (streamlitPreviewResponse.type === 'error') {
      return streamlitPreviewResponse
    }

    if (this.isCurrentPreivewForCurrentNotebook(notebookPanel)) {
      // If there is already a preview window for the current app, 
      // then don't create a new widget. The backend will update the 
      // .py file and the app preview will update automatically
      return streamlitPreviewResponse
    }
    
    // Create the new preview widget
    const widget = this.createPreviewWidget(
      app,
      notebookPanel,
      this.appDeployService,
      this.appManagerService,
      streamlitPreviewResponse
    );

    // Store current preview info
    this.currentPreview = widget;

    // Add widget to main area with split-right mode
    app.shell.add(widget, 'main', {
      mode: 'split-right',
      ref: notebookPanel.id
    });

    return streamlitPreviewResponse;
  }

  /**
   * Edit the existing Streamlit app preview by updating the app.py file.
   * The preview will auto-refresh due to --server.runOnSave in manager.py
   */
  async editExistingPreview(
    editPrompt: string,
    notebookPanel: NotebookPanel
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> {
    if (!this.currentPreview) {
      throw new Error('No active preview to edit');
    }

    // First save the notebook to ensure the app is able
    // to read the most up to date version of the notebook.
    // Because we are parsing the notebook on the backend by reading 
    // the file system, it only sees the last saved version of the notebook.
    await notebookPanel.context.save();
    const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel)

    // Update the app with the edit prompt
    const streamlitPreviewResponse = await startStreamlitPreviewAndNotify(
      notebookPanel.context.path, 
      notebookID,
      true, // force_recreate
      editPrompt, 
      'Editing Streamlit app...', 
      'Streamlit app updated successfully!'
    );

    return streamlitPreviewResponse
  }

  /**
   * Close the current preview if one exists.
   */
  closeCurrentPreview(): void {
    if (this.currentPreview) {
      console.log('Closing current preview');
      this.currentPreview.dispose();
      this.currentPreview = null;
    }
  }

  /**
   * Get the current preview widget.
   */
  getCurrentPreview(): MainAreaWidget | null {
    return this.currentPreview;
  }

  /** 
   * Check if the current app preview is for the target notebook
   */
  isCurrentPreivewForCurrentNotebook(notebookPanel: NotebookPanel): boolean {
    const currentPreivew = this.getCurrentPreview()
    if (currentPreivew === null) {
      return false
    }

    // Note we will identify a false position match when the user has two notebooks open
    // that have the same name because they are in different folders. However, its so unlikely
    // that a user two notebooks with the same name and one open as an app while trying to open the 
    // app for the other one. We ignore this case for now. Its not a big deal if it happens anyways
    const currentNotebookAppTitle = getAppPreviewNameFromNotebookPanel(notebookPanel)
    return currentNotebookAppTitle === currentPreivew.title.label
  }

  /**
   * Create a new preview widget with toolbar buttons.
   */
  private createPreviewWidget(
    app: JupyterFrontEnd,
    notebookPanel: NotebookPanel,
    appDeployService: IAppDeployService,
    appManagerService: IAppManagerService,
    previewData: StreamlitPreviewResponseSuccess
  ): MainAreaWidget {
    const iframeWidget = new IFrameWidget(previewData.url);

    // Log that the preview is open
    void logEvent('opened_streamlit_app_preview')

    // Create main area widget
    const widget = new MainAreaWidget({ content: iframeWidget });
    const notebookPath = notebookPanel.context.path;
    const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel)
    widget.title.label = getAppPreviewNameFromNotebookPanel(notebookPanel);
    widget.title.closable = true;

    // Create toolbar buttons
    const editAppButton = new ToolbarButton({
      className: 'text-button-mito-ai button-base button-small jp-ToolbarButton mito-deploy-button',
      onClick: (): void => {
        showUpdateAppDropdown(editAppButton.node, notebookPanel);
      },
      tooltip: 'Edit Streamlit App',
      label: 'Edit App',
      icon: EditLabIcon,
      iconClass: 'mito-ai-deploy-icon'
    });

    const recreateAppButton = new ToolbarButton({
      className: 'text-button-mito-ai button-base button-small jp-ToolbarButton mito-deploy-button',
      onClick: async (): Promise<void> => {
        await showRecreateAppConfirmation(notebookPath, notebookID);
      },
      tooltip: 'Recreate new App from scratch based on the current state of the notebook',
      label: 'Recreate App',
      icon: ResetCircleLabIcon,
      iconClass: 'mito-ai-deploy-icon'
    });

    const deployButton = new ToolbarButton({
      className: 'text-button-mito-ai button-base button-small jp-ToolbarButton mito-deploy-button',
      onClick: (): void => {
        void deployStreamlitApp(notebookPanel, appDeployService, appManagerService);
      },
      tooltip: 'Deploy Streamlit App',
      label: 'Deploy App',
      icon: DeployLabIcon,
      iconClass: 'mito-ai-deploy-icon'
    });
    
    // Insert the buttons into the toolbar
    widget.toolbar.insertAfter('spacer', 'edit-app-button', editAppButton);
    widget.toolbar.insertAfter('edit-app-button', 'recreate-app-button', recreateAppButton);

    if (app.commands.hasCommand(COMMAND_MITO_AI_BETA_MODE_ENABLED)) {
      widget.toolbar.insertAfter('recreate-app-button', 'deploy-app-button', deployButton);
    }

    // Handle widget disposal
    widget.disposed.connect(() => {
      console.log('Widget disposed, stopping preview');
      if (previewData) {
        void stopStreamlitPreview(previewData.id);
      }
      // Clear our reference when the widget is disposed
      if (this.currentPreview === widget) {
        this.currentPreview = null;
      }
    });

    return widget;
  }
}

/**
 * The streamlit preview plugin.
 */
const StreamlitPreviewPlugin: JupyterFrontEndPlugin<IStreamlitPreviewManager> = {
  id: 'mito-ai:streamlit-preview',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette, IAppDeployService, IAppManagerService],
  provides: IStreamlitPreviewManager,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette,
    appDeployService: IAppDeployService,
    appManagerService: IAppManagerService
  ): IStreamlitPreviewManager => {
    console.log('mito-ai: StreamlitPreviewPlugin activated');
    
    // Create the service instance
    const streamlitPreviewManager = new StreamlitAppPreviewManager(appDeployService, appManagerService);
    
    // Add command to command palette
    app.commands.addCommand(COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT, {
      label: 'Preview as Streamlit',
      caption: 'Convert current notebook to Streamlit app and preview it',
      execute: async () => {
        // Instead of using the notebook tracker, we could pass the notebook panel directly, but this button
        // is only used in the notebook toolbar, so its okay.
        if (notebookTracker.currentWidget) {
          await streamlitPreviewManager.openAppPreview(app, notebookTracker.currentWidget)
        } else {
          console.error('No notebook is currently active');
        }
      }
    });

    // Add to command palette
    palette.addItem({
      command: COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT,
      category: 'Mito AI'
    });

    // Return the service so other plugins can use it
    return streamlitPreviewManager;
  }
};

export default StreamlitPreviewPlugin; 
