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

/**
 * Interface for the streamlit preview response.
 */
export interface StreamlitPreviewResponse {
  id: string;
  port: number;
  url: string;
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

    // Add command to command palette
    app.commands.addCommand(COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT, {
      label: 'Preview as Streamlit',
      caption: 'Convert current notebook to Streamlit app and preview it',
      execute: async () => {
        await previewNotebookAsStreamlit(app, notebookTracker, appDeployService, appManagerService);
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
): Promise<void> {
  const notebookPanel = notebookTracker.currentWidget;
  if (!notebookPanel) {
    Notification.error('No notebook is currently active');
    return;
  }

  // First save the notebook to ensure the app is up to date
  await notebookPanel.context.save();

  const notebookPath = notebookPanel.context.path;
  const notebookName = PathExt.basename(notebookPath, '.ipynb');


  try {
    const previewData = await startStreamlitPreviewAndNotify(notebookPath);

    if (previewData === undefined) {
      return;
    }

    // Create iframe widget
    // TODO: Instead of having this widget creation code in the previewNotebookAsStreamlit function, 
    // I wonder if we can make it part of the StreamlitPreviewPlugin. What we want is the following: 
    // a react component that takes the app, notebookTracker, and appDeployService as a prop and is 
    // already set up with this layout. Each time it opens, we're just deciding which notebook to display.
    const iframeWidget = new IFrameWidget(previewData.url);

    // Create main area widget
    const widget = new MainAreaWidget({ content: iframeWidget });
    widget.title.label = `App Preview (${notebookName})`;
    widget.title.closable = true;


    /* ******************************************************
     * Create Streamlit App Toolbar Buttons
     ****************************************************** */
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
    
    // Insert the button into the toolbar
    widget.toolbar.insertAfter('spacer', 'edit-app-button', editAppButton);
    widget.toolbar.insertAfter('edit-app-button', 'recreate-app-button', recreateAppButton);
    widget.toolbar.insertAfter('recreate-app-button', 'deploy-app-button', deployButton);

    // Handle widget disposal
    widget.disposed.connect(() => {
      console.log('Widget disposed, stopping preview');
      void stopStreamlitPreview(previewData.id);
    });

    // Add widget to main area with split-right mode
    app.shell.add(widget, 'main', {
      mode: 'split-right',
      ref: notebookPanel.id
    });
  }
  catch (error) {
    console.error('Error starting streamlit preview:', error);
  }
}

export default StreamlitPreviewPlugin; 
