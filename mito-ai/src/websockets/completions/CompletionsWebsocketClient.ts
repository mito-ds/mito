/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type {
  CompleterMessage,
  ICompletionRequest,
  ICompletionStreamChunk
} from './CompletionModels';
import { BaseWebsocketClient, IBaseWebsocketClientOptions } from '../BaseWebsocketClient';
import { IStream } from '@lumino/signaling';

/**
 * The instantiation options for the inline completion client.
 */
export interface ICompletionWebsocketClientOptions extends IBaseWebsocketClientOptions {}

/**
 * Mito AI completion client
 *
 * It communicates with the backend over a WebSocket to allow streaming answer.
 */
export class CompletionWebsocketClient extends BaseWebsocketClient<ICompletionRequest, CompleterMessage, ICompletionStreamChunk> {
  /**
   * The service URL for the websocket endpoint.
   */
  protected readonly SERVICE_URL = 'mito-ai/completions';

  /**
   * Create a new completion client.
   */
  constructor(options: ICompletionWebsocketClientOptions = {}) {
    super(options);
  }

  /**
   * Completion chunk stream.
   */
  get messages(): IStream<CompletionWebsocketClient, CompleterMessage> {
    return this._messages as unknown as IStream<CompletionWebsocketClient, CompleterMessage>;
  }

  /**
   * Completion chunk stream.
   */
  get stream(): IStream<CompletionWebsocketClient, ICompletionStreamChunk> {
    return this._stream as unknown as IStream<CompletionWebsocketClient, ICompletionStreamChunk>;
  }

  /**
   * Stream of connection status events
   */
  get connectionStatus(): IStream<CompletionWebsocketClient, 'connected' | 'disconnected'> {
    return this._connectionStatus as unknown as IStream<CompletionWebsocketClient, 'connected' | 'disconnected'>;
  }

  /**
   * Extract the message ID from a request message.
   */
  protected getMessageId(message: ICompletionRequest): string {
    return message.message_id;
  }

  /**
   * Process a message received from the websocket.
   */
  protected _onMessage(message: CompleterMessage): void {
    /**
     * Emit unconditionally the message to interested parties.
     */
    this._messages.emit(message);

    /**
     * Dispatch completion messages
     */
    switch (message.type) {
      case 'chunk': {
        // To see the stream in action, uncomment the following line
        // console.log(`[Mito AI Stream] ${message.done ? 'FINAL' : ''} Chunk:`, message.chunk.content);
        this._stream.emit(message);
        break;
      }
      case 'reply': {
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
            });
          }
          // This will get triggered when streaming and there is an error message.
          // However, errors are handled via the emit seen above above.
          console.warn('Unhandled mito ai completion message', message);
        }
        break;
      }
      // default: /* no-op */
    }
  }
}
