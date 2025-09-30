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
import { DeployLabIcon } from '../../icons';
import '../../../style/StreamlitPreviewPlugin.css';
import { startStreamlitPreviewAndNotify } from './utils';
import { SelectionOverlay, Rectangle } from './SelectionOverlay';
import { CommentInput } from './CommentInput';
import { ScreenshotCapture } from './ScreenshotCapture';

/**
 * Interface for the streamlit preview response.
 */
export interface StreamlitPreviewResponse {
  id: string;
  port: number;
  url: string;
}

/**
 * Enhanced HTML widget for displaying iframe content with screenshot selection.
 */
class IFrameWidget extends Widget {
  private iframe: HTMLIFrameElement;
  private selectionOverlay: SelectionOverlay;
  private screenshotCapture: ScreenshotCapture;
  private editModeEnabled = false;
  private currentCommentInput: CommentInput | null = null;
  private notebookPath: string;

  constructor(url: string, notebookPath: string) {
    super();
    this.addClass('jp-iframe-widget');
    this.notebookPath = notebookPath;
    
    // Create container with relative positioning for overlay
    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
    `;
    
    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.src = url;
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    
    container.appendChild(this.iframe);
    this.node.appendChild(container);

    // Initialize screenshot capture
    this.screenshotCapture = new ScreenshotCapture();

    // Initialize selection overlay
    this.selectionOverlay = new SelectionOverlay(
      container,
      (rect) => this.handleSelectionComplete(rect)
    );
  }
  
  setUrl(url: string): void {
    this.iframe.src = url;
  }

  /**
   * Enable/disable edit mode
   */
  public setEditMode(enabled: boolean): void {
    this.editModeEnabled = enabled;
    this.selectionOverlay.setEnabled(enabled);
    
    // Visual feedback
    this.node.classList.toggle('edit-mode', enabled);
  }

  /**
   * Handle completed rectangle selection
   */
  private handleSelectionComplete(rect: Rectangle): void {
    // Disable further selections while processing
    this.selectionOverlay.setEnabled(false);

    // Show comment input
    this.currentCommentInput = new CommentInput(
      this.node.firstChild as HTMLElement,
      rect,
      (comment) => this.handleCommentSubmit(rect, comment),
      () => this.handleCommentCancel()
    );
  }

  /**
   * Handle comment submission - capture screenshot and send to AI
   */
  private async handleCommentSubmit(
    rect: Rectangle,
    comment: string
  ): Promise<void> {
    try {
      // 1. Capture screenshot via server
      const screenshot = await this.screenshotCapture.captureRegion(
        this.iframe,
        rect
      );

      // 2. Send to AI service
      await this.sendToAI(screenshot, comment, rect);

      // 3. Cleanup
      this.handleCommentCancel();

      // 4. Show success notification
      Notification.success('AI is processing your request...', {
        autoClose: 3000
      });

    } catch (error) {
      console.error('Failed to process edit request:', error);
      Notification.error('Failed to capture screenshot', {
        autoClose: false
      });
      throw error;
    }
  }

  /**
   * Handle comment cancellation
   */
  private handleCommentCancel(): void {
    if (this.currentCommentInput) {
      this.currentCommentInput.dispose();
      this.currentCommentInput = null;
    }

    // Clear selection
    this.selectionOverlay.clearSelection();

    // Re-enable edit mode
    if (this.editModeEnabled) {
      this.selectionOverlay.setEnabled(true);
    }
  }

  /**
   * Send screenshot + comment to AI
   */
  private async sendToAI(
    screenshot: Blob,
    comment: string,
    rect: Rectangle
  ): Promise<void> {
    // TODO: Implement AI service integration
    // For now, just log the request
    console.log('AI Request:', {
      comment,
      region: rect,
      notebookPath: this.notebookPath,
      screenshotSize: screenshot.size
    });

    // Placeholder for AI integration - convert blob to base64 when ready
    // const base64 = await this.blobToBase64(screenshot);
    // const response = await fetch('/api/mito-ai/streamlit-edit', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     screenshot: base64,
    //     comment: comment,
    //     region: rect,
    //     notebookPath: this.notebookPath
    //   })
    // });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  dispose(): void {
    this.selectionOverlay.dispose();
    if (this.currentCommentInput) {
      this.currentCommentInput.dispose();
    }
    super.dispose();
  }
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

  let globalNotificationId: string | undefined;

  try {
    const { previewData, notificationId } = await startStreamlitPreviewAndNotify(notebookPath);
    globalNotificationId = notificationId;

    // Create iframe widget with screenshot capabilities
    const iframeWidget = new IFrameWidget(previewData.url, notebookPath);

    // Create main area widget
    const widget = new MainAreaWidget({ content: iframeWidget });
    widget.title.label = `App Preview (${notebookName})`;
    widget.title.closable = true;

    // Add Edit Mode button
    const editModeButton = new ToolbarButton({
      className: 'text-button-mito-ai button-base button-small jp-ToolbarButton mito-edit-mode-button',
      onClick: (): void => {
        const currentMode = iframeWidget['editModeEnabled'];
        iframeWidget.setEditMode(!currentMode);
        editModeButton.label = !currentMode ? 'Exit Edit Mode' : 'Edit Mode';
      },
      tooltip: 'Enable screenshot selection mode to edit with AI',
      label: 'Edit Mode',
      icon: DeployLabIcon,
      iconClass: 'mito-ai-deploy-icon'
    });

    // Add Deploy button
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

    // Add Rebuild button
    const refreshButton = new ToolbarButton({
      className: 'text-button-mito-ai button-base button-small jp-ToolbarButton mito-deploy-button',
      onClick: (): void => {
        void startStreamlitPreviewAndNotify(notebookPath, true);
      },
      tooltip: 'Rebuild Streamlit App',
      label: 'Rebuild App',
      icon: DeployLabIcon,
      iconClass: 'mito-ai-deploy-icon'
    });
    
    // Insert buttons into the toolbar
    widget.toolbar.insertAfter('spacer', 'edit-mode-button', editModeButton);
    widget.toolbar.insertAfter('spacer', 'refresh-app-button', refreshButton);
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

  } catch (error) {
    console.error('Error starting streamlit preview:', error);
    
    // Update notification to error
    if (globalNotificationId) {
      Notification.update({
        id: globalNotificationId,
        message: `Failed to start preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        autoClose: false
      });
    }
  }
}

export default StreamlitPreviewPlugin; 
