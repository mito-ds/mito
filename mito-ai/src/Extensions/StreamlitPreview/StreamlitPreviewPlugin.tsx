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
import { previewAsStreamlit } from '../../commands';

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
  requires: [INotebookTracker, ICommandPalette, IChatTracker],
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette
  ) => {
    console.log('mito-ai: StreamlitPreviewPlugin activated');

    // Add command to command palette
    app.commands.addCommand(previewAsStreamlit, {
      label: 'Preview as Streamlit',
      caption: 'Convert current notebook to Streamlit app and preview it',
      execute: async () => {
        await previewNotebookAsStreamlit(app, notebookTracker);
      }
    });

    // Add to command palette
    palette.addItem({
      command: previewAsStreamlit,
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