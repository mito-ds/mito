/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ICommandPalette, ToolbarButton } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { Notification } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { stopStreamlitPreview } from '../../restAPI/RestAPI';
import { deployStreamlitApp } from '../AppDeploy/DeployStreamlitApp';
import { IAppDeployService } from '../AppDeploy/AppDeployPlugin';
import { IAppManagerService } from '../AppManager/ManageAppsPlugin';
import { COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT } from '../../commands';
import { DeployLabIcon, EditLabIcon, ResetCircleLabIcon } from '../../icons';
import '../../../style/StreamlitPreviewPlugin.css';
import { startStreamlitPreviewAndNotify } from './utils';
import * as React from 'react';
import UpdateAppDropdown from './UpdateAppDropdown';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { createRoot } from 'react-dom/client';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';


/**
 * Interface for the streamlit preview response.
 */
export interface StreamlitPreviewResponse {
  id: string;
  port: number;
  url: string;
}

export const APP_PREVIEW_TITLE = 'App Preview';

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
class StreamlitAppPreviewPlugin {
  private currentPreview: MainAreaWidget | null = null;
  private appDeployService: IAppDeployService | null = null;
  private appManagerService: IAppManagerService | null = null;

  /**
   * Set the services for the plugin.
   */
  setServices(appDeployService: IAppDeployService, appManagerService: IAppManagerService): void {
    this.appDeployService = appDeployService;
    this.appManagerService = appManagerService;
  }

  /**
   * Create a new Streamlit app preview, replacing any existing preview.
   */
  async createNewPreview(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    appDeployService: IAppDeployService | null,
    appManagerService: IAppManagerService | null,
    previewData?: StreamlitPreviewResponse
  ): Promise<MainAreaWidget> {
    // Close existing preview if any
    this.closeCurrentPreview();

    const notebookPanel = notebookTracker.currentWidget;
    if (!notebookPanel) {
      throw new Error('No notebook is currently active');
    }

    // First save the notebook to ensure the app is up to date
    await notebookPanel.context.save();

    const notebookPath = notebookPanel.context.path;
    const notebookName = PathExt.basename(notebookPath, '.ipynb');

    let finalPreviewData = previewData;
    if (finalPreviewData === undefined) {
      finalPreviewData = await startStreamlitPreviewAndNotify(notebookPath);
    }

    if (finalPreviewData === undefined) {
      throw new Error('Failed to create Streamlit preview');
    }

    // Get services if not provided
    const deployService = appDeployService || this.appDeployService;
    const managerService = appManagerService || this.appManagerService;

    if (!deployService || !managerService) {
      throw new Error('App services not available. Please ensure the StreamlitPreviewPlugin is properly initialized.');
    }

    // Create the new preview widget
    const widget = this.createPreviewWidget(
      notebookTracker,
      notebookName,
      notebookPath,
      deployService,
      managerService,
      finalPreviewData
    );

    // Store current preview info
    this.currentPreview = widget;

    // Add widget to main area with split-right mode
    app.shell.add(widget, 'main', {
      mode: 'split-right',
      ref: notebookPanel.id
    });

    return widget;
  }

  /**
   * Edit the existing Streamlit app preview by updating the app.py file.
   * The preview will auto-refresh due to --server.runOnSave in manager.py
   */
  async editExistingPreview(
    editPrompt: string,
    notebookPath: string
  ): Promise<void> {
    if (!this.currentPreview) {
      throw new Error('No active preview to edit');
    }

    // Update the app with the edit prompt
    await startStreamlitPreviewAndNotify(
      notebookPath, 
      true, // force_recreate
      editPrompt, 
      'Editing Streamlit app...', 
      'Streamlit app updated successfully!'
    );
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
   * Check if there's an active preview.
   */
  hasActivePreview(): boolean {
    return this.currentPreview !== null;
  }

  /**
   * Get the current preview widget.
   */
  getCurrentPreview(): MainAreaWidget | null {
    return this.currentPreview;
  }

  /**
   * Create a new preview widget with toolbar buttons.
   */
  private createPreviewWidget(
    notebookTracker: INotebookTracker,
    notebookName: string,
    notebookPath: string,
    appDeployService: IAppDeployService,
    appManagerService: IAppManagerService,
    previewData: StreamlitPreviewResponse
  ): MainAreaWidget {
    const iframeWidget = new IFrameWidget(previewData.url);

    // Create main area widget
    const widget = new MainAreaWidget({ content: iframeWidget });
    widget.title.label = `${APP_PREVIEW_TITLE} (${notebookName})`;
    widget.title.closable = true;

    // Create toolbar buttons
    const editAppButton = new ToolbarButton({
      className: 'text-button-mito-ai button-base button-small jp-ToolbarButton mito-deploy-button',
      onClick: (): void => {
        showUpdateAppDropdown(editAppButton.node, notebookPath);
      },
      tooltip: 'Edit Streamlit App',
      label: 'Edit App',
      icon: EditLabIcon,
      iconClass: 'mito-ai-deploy-icon'
    });

    const recreateAppButton = new ToolbarButton({
      className: 'text-button-mito-ai button-base button-small jp-ToolbarButton mito-deploy-button',
      onClick: async (): Promise<void> => {
        await showRecreateAppConfirmation(notebookPath);
      },
      tooltip: 'Recreate new App from scratch based on the current state of the notebook',
      label: 'Recreate App',
      icon: ResetCircleLabIcon,
      iconClass: 'mito-ai-deploy-icon'
    });

    const deployButton = new ToolbarButton({
      className: 'text-button-mito-ai button-base button-small jp-ToolbarButton mito-deploy-button',
      onClick: (): void => {
        void deployStreamlitApp(notebookTracker, appDeployService, appManagerService);
      },
      tooltip: 'Deploy Streamlit App',
      label: 'Deploy App',
      icon: DeployLabIcon,
      iconClass: 'mito-ai-deploy-icon'
    });
    
    // Insert the buttons into the toolbar
    widget.toolbar.insertAfter('spacer', 'edit-app-button', editAppButton);
    widget.toolbar.insertAfter('edit-app-button', 'recreate-app-button', recreateAppButton);
    widget.toolbar.insertAfter('recreate-app-button', 'deploy-app-button', deployButton);

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

// Global instance
export const streamlitAppPreviewPlugin = new StreamlitAppPreviewPlugin();

async function showRecreateAppConfirmation(notebookPath: string): Promise<void> {
  const result = await showDialog({
    title: 'Recreate App',
    body: 'This will recreate the app from scratch, discarding all your current edits. This action cannot be undone. Are you sure you want to continue?',
    buttons: [
      Dialog.cancelButton({ label: 'Cancel' }),
      Dialog.warnButton({ label: 'Recreate App' })
    ],
    defaultButton: 1
  });

  if (result.button.accept) {
    void startStreamlitPreviewAndNotify(notebookPath, true, undefined, 'Recreating app from scratch...', 'App recreated successfully!');
  }
}

/**
 * Show the update app dropdown.
 */
function showUpdateAppDropdown(buttonElement: HTMLElement, notebookPath: string): void {
  // Remove any existing dropdown
  const existingDropdown = document.querySelector('.update-app-dropdown');
  if (existingDropdown) {
    existingDropdown.remove();
  }

  // Create dropdown container
  const dropdownContainer = document.createElement('div');
  dropdownContainer.className = 'update-app-dropdown';
  dropdownContainer.style.position = 'absolute';
  dropdownContainer.style.zIndex = '1000';

  // Position the dropdown below the button
  const buttonRect = buttonElement.getBoundingClientRect();
  dropdownContainer.style.top = `${buttonRect.bottom + 4}px`;
  dropdownContainer.style.left = `${buttonRect.left}px`;

  // Add to document
  document.body.appendChild(dropdownContainer);

  // Render the React component
  createRoot(dropdownContainer).render(
    <UpdateAppDropdown
      onSubmit={async (message) => {
        await startStreamlitPreviewAndNotify(notebookPath, true, message, 'Updating app...', 'App updated successfully!');
        dropdownContainer.remove();
      }}
      onClose={() => {
        dropdownContainer.remove();
      }}
    />
  );

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent): void => {
    if (!dropdownContainer.contains(event.target as Node) &&
      !buttonElement.contains(event.target as Node)) {
      dropdownContainer.remove();
      document.removeEventListener('mousedown', handleClickOutside);
    }
  };

  // Add click outside listener after a small delay to avoid immediate closure
  setTimeout(() => {
    document.addEventListener('mousedown', handleClickOutside);
  }, 100);
}

/**
 * The streamlit preview plugin.
 */
const StreamlitPreviewPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:streamlit-preview',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette, IAppDeployService, IAppManagerService],
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette,
    appDeployService: IAppDeployService,
    appManagerService: IAppManagerService
  ) => {
    console.log('mito-ai: StreamlitPreviewPlugin activated');
    
    // Set services for the plugin
    streamlitAppPreviewPlugin.setServices(appDeployService, appManagerService);
    
    // Add command to command palette
    app.commands.addCommand(COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT, {
      label: 'Preview as Streamlit',
      caption: 'Convert current notebook to Streamlit app and preview it',
      execute: async (args?: ReadonlyPartialJSONObject) => {
        const previewData = args?.previewData as StreamlitPreviewResponse | undefined;
        await previewNotebookAsStreamlit(app, notebookTracker, appDeployService, appManagerService, previewData);
      }
    });

    // Add to command palette
    palette.addItem({
      command: COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT,
      category: 'Mito AI'
    });
  }
};

/**
 * Preview the current notebook as a Streamlit app.
 */
async function previewNotebookAsStreamlit(
  app: JupyterFrontEnd,
  notebookTracker: INotebookTracker,
  appDeployService: IAppDeployService,
  appManagerService: IAppManagerService,
  previewData?: StreamlitPreviewResponse | undefined
): Promise<void> {
  try {
    await streamlitAppPreviewPlugin.createNewPreview(
      app,
      notebookTracker,
      appDeployService,
      appManagerService,
      previewData
    );
  }
  catch (error) {
    console.error('Error creating Streamlit preview:', error);
    Notification.error(`Failed to create Streamlit preview: ${error}`);
  }
}


export default StreamlitPreviewPlugin; 
