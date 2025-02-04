import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { markdownIcon } from '@jupyterlab/ui-components';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getMarkdownDocumentation } from './DocGenerator';
import { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { CompleterMessage, ErrorMessage, IAICapabilities } from '../../utils/websocket/models';
import { Signal } from '@lumino/signaling';

interface MarkdownButtonWidgetProps {
    app: JupyterFrontEnd;
  notebookTracker: INotebookTracker;
}

class MarkdownButtonWidget extends ReactWidget {
    protected websocketClient: CompletionWebsocketClient;
    private _capabilitiesChanged = new Signal<this, IAICapabilities>(this);
  private _lastErrorChanged = new Signal<this, ErrorMessage>(this);
  constructor(private options: MarkdownButtonWidgetProps) {
    super();
    this.websocketClient = new CompletionWebsocketClient({
      serverSettings: options.app.serviceManager.serverSettings
    });

    this.websocketClient.messages.connect(this.onMessage, this);

    // Initialize the websocket client
    this.websocketClient.initialize().catch((error: any) => {
        console.error('Failed to initialized the websocketClient for the Mito AI Doc Generator panel', error);
      });
  }

  render(): JSX.Element {
    return (
      <button
        className="jp-ToolbarButtonComponent"
        title="Write Markdown Documentation for Selected Cells"
        onClick={async () => {
          await getMarkdownDocumentation(this.options.notebookTracker, this.websocketClient);
        }}
      >
        <markdownIcon.react />
      </button>
    );
  }

  protected onMessage(
    client: CompletionWebsocketClient,
    message: CompleterMessage
  ): void {
    switch (message.type) {
      case 'ai_capabilities':
        this._capabilitiesChanged.emit(message);
        break;
      case 'error':
        this._lastErrorChanged.emit(message);
        break;
    }
  }
}

export default MarkdownButtonWidget; 