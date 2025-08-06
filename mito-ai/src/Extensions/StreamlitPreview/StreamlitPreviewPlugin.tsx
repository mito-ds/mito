/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ICommandPalette } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { Notification } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { IChatTracker } from '../AiChat/token';
import { startStreamlitPreview, stopStreamlitPreview } from '../../restAPI/RestAPI';
import { COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT } from '../../commands';

/**
 * Interface for the streamlit preview response.
 */
export interface StreamlitPreviewResponse {
  id: string;
  port: number;
  url: string;
}

/**
 * Interface for the streamlit preview request.
 */
export interface StreamlitPreviewRequest {
  notebook_path: string;
}

/**
 * Simple HTML widget for displaying iframe content with a custom toolbar.
 */
class IFrameWidget extends Widget {
  private iframe: HTMLIFrameElement;
  private toolbar: HTMLElement;

  constructor(url: string) {
    super();
    this.addClass('jp-iframe-widget');
    
    // Create toolbar container
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'jp-StreamlitPreview-toolbar';
    this.toolbar.style.cssText = `
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background-color: var(--jp-layout-color1);
      border-bottom: 1px solid var(--jp-border-color1);
      gap: 8px;
    `;
    
    // Create hello world button
    const helloButton = document.createElement('button');
    helloButton.textContent = 'Hello World';
    helloButton.className = 'text-button-mito-ai button-base button-purple button-small';
    helloButton.style.cssText = `
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      padding: 2px 5px;
      background-color: var(--purple-300);
      color: var(--purple-700);
      white-space: nowrap;
    `;
    helloButton.addEventListener('click', () => {
      console.log('hello world');
    });
    
    // Add button to toolbar
    this.toolbar.appendChild(helloButton);
    
    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.src = url;
    this.iframe.style.cssText = `
      width: 100%;
      height: calc(100% - 40px);
      border: none;
    `;
    
    // Add toolbar and iframe to widget
    this.node.appendChild(this.toolbar);
    this.node.appendChild(this.iframe);
  }
  
  setUrl(url: string): void {
    if (this.iframe) {
      this.iframe.src = url;
    }
  }
}

/**
 * The streamlit preview plugin.
 */
const StreamlitPreviewPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:streamlit-preview',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette, IChatTracker],
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette
  ) => {
    console.log('mito-ai: StreamlitPreviewPlugin activated');

    // Add command to command palette
    app.commands.addCommand(COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT, {
      label: 'Preview as Streamlit',
      caption: 'Convert current notebook to Streamlit app and preview it',
      execute: async () => {
        await previewNotebookAsStreamlit(app, notebookTracker);
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
  notebookTracker: INotebookTracker
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