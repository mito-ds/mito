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
import { IChatTracker } from '../AiChat/token';
import { startStreamlitPreview, stopStreamlitPreview, updateStreamlitPreview } from '../../restAPI/RestAPI';
import { COMMAND_MITO_AI_PREVIEW_AS_STREAMLIT } from '../../commands';
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * React component for the update app dropdown.
 */
interface UpdateAppDropdownProps {
  onSubmit: (message: string) => void;
  onClose: () => void;
  previewId: string;
}

const UpdateAppDropdown: React.FC<UpdateAppDropdownProps> = ({ onSubmit, onClose, previewId }) => {
  const [message, setMessage] = React.useState('');

  const handleSubmit = () => {
    if (message.trim()) {
      onSubmit(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: '100%',
        left: '0',
        zIndex: 1000,
        backgroundColor: 'var(--jp-layout-color1)',
        border: '1px solid var(--jp-border-color1)',
        borderRadius: '3px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        minWidth: '300px',
        maxWidth: '500px'
      }}
      onKeyDown={handleKeyDown}
    >
      <div style={{ padding: '12px' }}>
        <label 
          htmlFor="update-description" 
          style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            color: 'var(--jp-ui-font-color1)',
            fontSize: 'var(--jp-ui-font-size1)'
          }}
        >
          Describe the update you want:
        </label>
        <textarea
          id="update-description"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your update description here... (Ctrl+Enter to submit)"
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '8px',
            border: '1px solid var(--jp-border-color1)',
            borderRadius: '3px',
            fontFamily: 'var(--jp-ui-font-family)',
            fontSize: 'var(--jp-ui-font-size1)',
            resize: 'vertical',
            boxSizing: 'border-box',
            backgroundColor: 'var(--jp-input-background)',
            color: 'var(--jp-ui-font-color1)'
          }}
          autoFocus
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '8px', 
          marginTop: '12px' 
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '4px 8px',
              border: '1px solid var(--jp-border-color1)',
              borderRadius: '3px',
              backgroundColor: 'var(--jp-layout-color1)',
              color: 'var(--jp-ui-font-color1)',
              cursor: 'pointer',
              fontFamily: 'var(--jp-ui-font-family)',
              fontSize: 'var(--jp-ui-font-size0)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!message.trim()}
            style={{
              padding: '4px 8px',
              border: 'none',
              borderRadius: '3px',
              backgroundColor: message.trim() ? 'var(--jp-accent-color1)' : 'var(--jp-layout-color2)',
              color: message.trim() ? 'var(--jp-ui-font-color0)' : 'var(--jp-ui-font-color2)',
              cursor: message.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--jp-ui-font-family)',
              fontSize: 'var(--jp-ui-font-size0)'
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

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
 * Show the update app dropdown.
 */
function showUpdateAppDropdown(buttonElement: HTMLElement, previewId: string): void {
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
  ReactDOM.render(
    <UpdateAppDropdown
      previewId={previewId}
      onSubmit={async (message) => {
        try {
          await updateStreamlitPreview(previewId, message);
          console.log('Update App Message sent successfully:', message);
        } catch (error) {
          console.error('Error updating app:', error);
        }
        dropdownContainer.remove();
      }}
      onClose={() => {
        dropdownContainer.remove();
      }}
    />,
    dropdownContainer
  );

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
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

    // Add toolbar button to the MainAreaWidget's toolbar
    const updateButton = new ToolbarButton({
      className: 'text-button-mito-ai button-base button-purple button-small',
      onClick: (): void => {
        showUpdateAppDropdown(updateButton.node, previewData.id);
      },
      tooltip: 'Update the Streamlit app',
      label: 'Update App',
    });
    
    // Insert the button into the toolbar
    widget.toolbar.insertAfter('spacer', 'update-app-button', updateButton);

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