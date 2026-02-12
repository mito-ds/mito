/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { Widget } from '@lumino/widgets';
import { Token } from '@lumino/coreutils';
import { stopStreamlitPreview } from '../../restAPI/RestAPI';
import { startStreamlitPreviewAndNotify } from './utils';


/**
 * The token for the StreamlitPreview service.
 */
export const IStreamlitPreviewManager = new Token<IStreamlitPreviewManager>(
  'mito-ai:IStreamlitPreviewManager',
  'Token for the StreamlitPreview service that manages app preview processes'
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
 * Pure process manager -- no UI creation.
 */
export interface IStreamlitPreviewManager {
  /**
   * Start a new Streamlit preview process for the given notebook.
   */
  startPreview(
    notebookPath: string,
    notebookID: string | undefined,
    createPrompt?: string
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError>;

  /**
   * Edit the existing Streamlit app by regenerating the app file.
   * The running Streamlit server will auto-refresh.
   */
  editPreview(
    notebookPath: string,
    notebookID: string | undefined,
    editPrompt: string
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError>;

  /**
   * Stop a Streamlit preview process and free its port.
   */
  stopPreview(previewId: string): Promise<void>;
}

/**
 * Simple HTML widget for displaying iframe content.
 */
export class IFrameWidget extends Widget {
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
 * Pure process manager for Streamlit app previews.
 */
class StreamlitProcessManager implements IStreamlitPreviewManager {
  async startPreview(
    notebookPath: string,
    notebookID: string | undefined,
    createPrompt: string = ''
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> {
    return startStreamlitPreviewAndNotify(notebookPath, notebookID, false, createPrompt);
  }

  async editPreview(
    notebookPath: string,
    notebookID: string | undefined,
    editPrompt: string
  ): Promise<StreamlitPreviewResponseSuccess | StreamlitPreviewResponseError> {
    return startStreamlitPreviewAndNotify(
      notebookPath,
      notebookID,
      false,
      editPrompt,
      'Editing Streamlit app...',
      'Streamlit app updated successfully!'
    );
  }

  async stopPreview(previewId: string): Promise<void> {
    await stopStreamlitPreview(previewId);
  }
}

/**
 * The streamlit preview plugin -- pure process management, no UI.
 */
const StreamlitPreviewPlugin: JupyterFrontEndPlugin<IStreamlitPreviewManager> = {
  id: 'mito-ai:streamlit-preview',
  autoStart: true,
  requires: [],
  provides: IStreamlitPreviewManager,
  activate: (
    _app: JupyterFrontEnd,
  ): IStreamlitPreviewManager => {
    console.log('mito-ai: StreamlitPreviewPlugin activated (process manager)');
    return new StreamlitProcessManager();
  }
};

export default StreamlitPreviewPlugin;
