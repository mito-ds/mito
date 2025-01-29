import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { Signal, ISignal } from '@lumino/signaling';
import { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';
import type { CompleterMessage, ErrorMessage, IAICapabilities } from '../../utils/websocket/models';
import ComposerComponent from './ComposerTaskpane';

class ComposerWidget extends ReactWidget {
    protected websocketClient: CompletionWebsocketClient;
    private _capabilitiesChanged = new Signal<this, IAICapabilities>(this);
    private _lastErrorChanged = new Signal<this, ErrorMessage>(this);

    constructor(protected options: { app: JupyterFrontEnd }) {
        super();
        this.addClass('mito-composer');

        // Create the websocket client
        this.websocketClient = new CompletionWebsocketClient({
            serverSettings: options.app.serviceManager.serverSettings
        });

        this.websocketClient.messages.connect(this.onMessage, this);

        // Initialize the websocket client
        this.websocketClient.initialize().catch((error: any) => {
            console.error('Failed to initialize the websocketClient for the Mito AI Composer', error);
        });
    }

    get capabilitiesChanged(): ISignal<this, IAICapabilities> {
        return this._capabilitiesChanged;
    }

    get lastErrorChanged(): ISignal<this, ErrorMessage> {
        return this._lastErrorChanged;
    }

    dispose(): void {
        if (this.isDisposed) {
            return;
        }
        this.websocketClient.dispose();
        super.dispose();
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

    render(): JSX.Element {
        return <ComposerComponent websocketClient={this.websocketClient} />;
    }
}

export function buildComposerWidget(app: JupyterFrontEnd): ComposerWidget {
    const composerWidget = new ComposerWidget({ app });
    composerWidget.id = 'mito-composer';
    return composerWidget;
}

export default ComposerWidget;