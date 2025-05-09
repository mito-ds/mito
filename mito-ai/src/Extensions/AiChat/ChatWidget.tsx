/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import ChatTaskpane from './ChatTaskpane';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { LabIcon } from '@jupyterlab/ui-components';
import chatIconSvg from '../../../src/icons/ChatIcon.svg';
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { getOperatingSystem, type OperatingSystem } from '../../utils/user';
import type { IChatWidget as IChatWidget } from './token';
import { Signal, type ISignal } from '@lumino/signaling';
import type {
  CompleterMessage,
  ErrorMessage,
  IAICapabilities
} from '../../websockets/completions/CompletionModels';
import { CompletionWebsocketClient } from '../../websockets/completions/CompletionsWebsocketClient';
export const chatIcon = new LabIcon({
  name: 'mito_ai',
  svgstr: chatIconSvg
});

export class ChatWidget extends ReactWidget implements IChatWidget {
  protected websocketClient: CompletionWebsocketClient;
  private _capabilitiesChanged = new Signal<this, IAICapabilities>(this);
  private _lastErrorChanged = new Signal<this, ErrorMessage>(this);

  constructor(
    protected options: {
      app: JupyterFrontEnd;
      notebookTracker: INotebookTracker;
      renderMimeRegistry: IRenderMimeRegistry;
      contextManager: IContextManager;
      operatingSystem: OperatingSystem;
    }
  ) {
    super();
    // Create the websocket client
    this.websocketClient = new CompletionWebsocketClient({
      serverSettings: options.app.serviceManager.serverSettings
    });

    this.websocketClient.messages.connect(this.onMessage, this);

    // Initialize the websocket client
    this.websocketClient.initialize().catch((error: any) => {
      console.error('Failed to initialized the websocketClient for the Mito AI Chat panel', error);
    });
    this.title.icon = chatIcon;
    this.title.caption = 'AI Chat for your JupyterLab';
  }

  /**
   * Signal emitted when the capabilities of the AI provider changes.
   */
  get capabilitiesChanged(): ISignal<this, IAICapabilities> {
    return this._capabilitiesChanged;
  }

  /**
   * Signal emitted when the last error of the AI provider changes.
   */
  get lastErrorChanged(): ISignal<this, ErrorMessage> {
    return this._lastErrorChanged;
  }

  /**
   * Dispose the widget.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.websocketClient.dispose();
    super.dispose();
  }

  protected render(): JSX.Element {
    return (
      <ChatTaskpane
        app={this.options.app}
        notebookTracker={this.options.notebookTracker}
        renderMimeRegistry={this.options.renderMimeRegistry}
        contextManager={this.options.contextManager}
        operatingSystem={this.options.operatingSystem}
        websocketClient={this.websocketClient}
      />
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

export function buildChatWidget(
  app: JupyterFrontEnd,
  notebookTracker: INotebookTracker,
  renderMimeRegistry: IRenderMimeRegistry,
  contextManager: IContextManager,
): ChatWidget {
  // Get the operating system here so we don't have to do it each time the chat changes.
  // The operating system won't change, duh.
  const operatingSystem = getOperatingSystem();

  const chatWidget = new ChatWidget({
    app,
    notebookTracker,
    renderMimeRegistry,
    contextManager,
    operatingSystem
  });
  chatWidget.id = 'mito_ai';
  return chatWidget;
}
