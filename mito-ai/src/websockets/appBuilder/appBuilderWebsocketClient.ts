/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { type IStream } from '@lumino/signaling';
import type {
  IBuildAppReply,
  IAppBuilderRequest
} from './appBuilderModels';
import { BaseWebsocketClient, IBaseWebsocketClientOptions } from '../BaseWebsocketClient';

/**
 * The instantiation options for the app builder client.
 */
export interface IAppBuilderWebsocketClientOptions extends IBaseWebsocketClientOptions {}

/**
 * Mito AI app builder client
 *
 * It communicates with the backend over a WebSocket for app building functionality.
 */
export class AppBuilderWebsocketClient extends BaseWebsocketClient<IAppBuilderRequest, IBuildAppReply> {
  /**
   * The service URL for the websocket endpoint.
   */
  protected readonly SERVICE_URL = 'mito-ai/app-builder';

  /**
   * Create a new app builder client.
   */
  constructor(options: IAppBuilderWebsocketClientOptions = {}) {
    super(options);
  }

  /**
   * App builder messages stream.
   */
  get messages(): IStream<AppBuilderWebsocketClient, IBuildAppReply> {
    return this._messages as unknown as IStream<AppBuilderWebsocketClient, IBuildAppReply>;
  }

  /**
   * Stream of connection status events
   */
  get connectionStatus(): IStream<AppBuilderWebsocketClient, 'connected' | 'disconnected'> {
    return this._connectionStatus as unknown as IStream<AppBuilderWebsocketClient, 'connected' | 'disconnected'>;
  }

  /**
   * Extract the message ID from a request message.
   */
  protected getMessageId(message: IAppBuilderRequest): string {
    return message.message_id;
  }

  /**
   * Process a message received from the websocket.
   */
  protected _onMessage(message: IBuildAppReply): void {
    /**
     * Emit unconditionally the message to interested parties.
     */
    this._messages.emit(message);

    /**
     * Dispatch app builder messages
     */
    const resolver = this._pendingRepliesMap.get(message.parent_id);
    if (resolver) {
        resolver.resolve(message);
        this._pendingRepliesMap.delete(message.parent_id);
    } else {
        // For streaming responses, emit the error through the stream
        // We need to do this here because errors do not come in as "chunk" messages
        // they come in as "reply" messages.
        if (message.error) {
          this._stream.emit({
            type: 'chunk',
            chunk: { content: message.error.hint || message.error.title || "An error occurred" },
            done: true,
            parent_id: message.parent_id,
            error: message.error
          } as unknown as any);
        }
        // This will get triggered when streaming and there is an error message.
        // However, errors are handled via the emit seen above above.
        console.warn('Unhandled mito ai app builder message', message);
    }
  }
}
