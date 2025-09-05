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
import { startStreamlitPreview, stopStreamlitPreview } from '../../restAPI/RestAPI';
import { convertNotebookToStreamlit } from '../AppBuilder/NotebookToStreamlit';
import { IAppBuilderService } from '../AppBuilder/AppBuilderPlugin';
import { COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT } from '../../commands';
import { DeployLabIcon } from '../../icons';

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

/**
 * The streamlit preview plugin.
 */
const StreamlitPreviewPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:streamlit-preview',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette, IAppBuilderService],
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette,
    appBuilderService: IAppBuilderService
  ) => {
    console.log('mito-ai: StreamlitPreviewPlugin activated');

    // Add command to command palette
    app.commands.addCommand(COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT, {
      label: 'Preview as Streamlit',
      caption: 'Convert current notebook to Streamlit app and preview it',
      execute: async () => {
        await previewNotebookAsStreamlit(app, notebookTracker, appBuilderService);
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
  appBuilderService: IAppBuilderService
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

  // Show building notification
  const notificationId = Notification.emit(
    'Building App Preview...',
    'in-progress',
    { autoClose: false }
  );

  try {
    const previewData = await startStreamlitPreview(notebookPath);

    // Create iframe widget
    const iframeWidget = new IFrameWidget(previewData.url);

    // Create main area widget
    const widget = new MainAreaWidget({ content: iframeWidget });
    widget.title.label = `App Preview (${notebookName})`;
    widget.title.closable = true;

    // Add toolbar button to the MainAreaWidget's toolbar
    const deployButton = new ToolbarButton({
      className: 'text-button-mito-ai button-base button-small jp-ToolbarButton mito-deploy-button',
      onClick: (): void => {
        void convertNotebookToStreamlit(notebookTracker, appBuilderService);
      },
      tooltip: 'Deploy Streamlit App',
      label: 'Deploy App',
      icon: DeployLabIcon,
      iconClass: 'mito-ai-deploy-icon'
    });
    
    // Add custom styling for better icon alignment
    const style = document.createElement('style');
    style.textContent = `
      .mito-deploy-button {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 4px 8px !important;
      }
      .mito-deploy-button .mito-ai-deploy-icon {
        display: flex !important;
        align-items: center !important;
        height: 10px !important;
        width: 10px !important;
        font-size: 12px !important;
      }
      .mito-deploy-button::slotted(svg),
      .mito-deploy-button svg {
        width: 12px !important;
        height: 12px !important;
        max-width: 12px !important;
        max-height: 12px !important;
        margin-right: 4px !important;
      }
    `;
    document.head.appendChild(style);
    
    // Insert the button into the toolbar
    widget.toolbar.insertAfter('spacer', 'deploy-app-button', deployButton);

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

    // Update notification to success
    Notification.update({
      id: notificationId,
      message: 'Streamlit preview started successfully!',
      type: 'default',
      autoClose: false
    });

  } catch (error) {
    console.error('Error starting streamlit preview:', error);
    
    // Update notification to error
    Notification.update({
      id: notificationId,
      message: `Failed to start preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'error',
      autoClose: false
    });
  }
}

export default StreamlitPreviewPlugin; 