/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ServerConnection } from '@jupyterlab/services';
import { UUID } from '@lumino/coreutils';
import { CompletionWebsocketClient } from '../../websockets/completions/CompletionsWebsocketClient';
import type {
    ICommentInstantAnswerCompletionRequest,
    ICommentInstantAnswerMetadata,
    ICompletionReply,
    ICompletionStreamChunk,
} from '../../websockets/completions/CompletionModels';

export interface IInstantAnswerCallbacks {
    onChunk: (accumulated: string) => void;
    onDone: (full: string) => void;
    onError: (message: string) => void;
}

/**
 * Streams ephemeral AI answers for document-mode comments.
 *
 * Uses its own websocket client (like the inline completer) so instant
 * answers never share stream handlers with the chat taskpane, and filters
 * chunks by parent_id so multiple answers can stream concurrently — even
 * while the agent is working.
 */
export class CommentInstantAnswerService {
    private _client: CompletionWebsocketClient | null = null;
    private _ready: Promise<void> | null = null;

    constructor(private _serverSettings?: ServerConnection.ISettings) {}

    private async _getClient(): Promise<CompletionWebsocketClient> {
        if (this._client === null) {
            this._client = new CompletionWebsocketClient({
                serverSettings: this._serverSettings,
            });
            this._ready = this._client.initialize();
        }
        await this._ready;
        return this._client;
    }

    async requestInstantAnswer(
        metadata: ICommentInstantAnswerMetadata,
        callbacks: IInstantAnswerCallbacks,
    ): Promise<void> {
        let client: CompletionWebsocketClient;
        try {
            client = await this._getClient();
        } catch (error) {
            callbacks.onError(`Could not connect to Mito AI: ${error}`);
            return;
        }

        const messageId = UUID.uuid4();
        let accumulated = '';

        const streamHandler = (_: CompletionWebsocketClient, chunk: ICompletionStreamChunk): void => {
            if (chunk.parent_id !== messageId) {
                return;
            }
            if (chunk.error) {
                client.stream.disconnect(streamHandler, null);
                callbacks.onError(chunk.error.hint || chunk.error.title || 'An error occurred');
                return;
            }
            accumulated += chunk.chunk.content;
            if (chunk.done) {
                client.stream.disconnect(streamHandler, null);
                callbacks.onDone(accumulated);
            } else if (chunk.chunk.content) {
                callbacks.onChunk(accumulated);
            }
        };

        client.stream.connect(streamHandler, null);

        const completionRequest: ICommentInstantAnswerCompletionRequest = {
            type: 'comment_instant_answer',
            message_id: messageId,
            metadata: metadata,
            stream: true,
        };

        try {
            const reply = await client.sendMessage<ICommentInstantAnswerCompletionRequest, ICompletionReply>(completionRequest);
            // The backend acknowledges with an initial reply before streaming;
            // a reply carrying an error means the request failed before any chunks.
            if (reply.error) {
                client.stream.disconnect(streamHandler, null);
                callbacks.onError(reply.error.hint || reply.error.title || 'An error occurred');
            }
        } catch (error) {
            client.stream.disconnect(streamHandler, null);
            callbacks.onError(`${error}`);
        }
    }
}
