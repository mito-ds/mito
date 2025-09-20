/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// appManagerWebSocketClient
import { type IStream } from '@lumino/signaling';
import type {
  IManageAppReply,
  ICheckAppStatusReply,
  IAppManagerRequest
} from './appManagerModels';
import { BaseWebsocketClient, IBaseWebsocketClientOptions } from '../BaseWebsocketClient';

/**
 * The instantiation options for the app manager client.
 */
export interface IAppManagerWebsocketClientOptions extends IBaseWebsocketClientOptions {}

/**
 * Mito AI app manager client
 *
 * It communicates with the backend over a WebSocket for app managing functionality.
 */
export class AppManagerWebsocketClient extends BaseWebsocketClient<IAppManagerRequest, IManageAppReply | ICheckAppStatusReply> {
  /**
   * The service URL for the websocket endpoint.
   */
  protected readonly SERVICE_URL = 'mito-ai/app-manager';

  /**
   * Create a new app manager client.
   */
  constructor(options: IAppManagerWebsocketClientOptions = {}) {
    super(options);
  }

  /**
   * App manager messages stream.
   */
  get messages(): IStream<AppManagerWebsocketClient, IManageAppReply | ICheckAppStatusReply> {
    return this._messages as unknown as IStream<AppManagerWebsocketClient, IManageAppReply | ICheckAppStatusReply>;
  }

  /**
   * Stream of connection status events
   */
  get connectionStatus(): IStream<AppManagerWebsocketClient, 'connected' | 'disconnected'> {
    return this._connectionStatus as unknown as IStream<AppManagerWebsocketClient, 'connected' | 'disconnected'>;
  }

  /**
   * Get message ID from request (required by BaseWebsocketClient)
   */
  protected getMessageId(request: IAppManagerRequest): string {
    return `${request.type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Process a message received from the websocket.
   * Routes responses to the appropriate pending requests.
   */
  protected _onMessage(message: IManageAppReply | ICheckAppStatusReply): void {
    // Emit the message to stream listeners
    this._messages.emit(message);

    // Determine which pending request this message belongs to
    let pendingId: string | null = null;
    let pendingReply: any = null;

    const messageId = (message as any).message_id;

    // First, try to match by message_id
    if (messageId && this._pendingRepliesMap.has(messageId)) {
      pendingId = messageId;
      pendingReply = this._pendingRepliesMap.get(messageId);
    }
    // If no message_id, check if this is a response to a single pending request
    else if (this._pendingRepliesMap.size === 1 && !messageId) {
      const entries = Array.from(this._pendingRepliesMap.entries());
      if (entries.length > 0) {
        const entry = entries[0];
        if (entry) {
          pendingId = entry[0];
          pendingReply = entry[1];
        }
      }
    }

    // Guard clause - exit if we couldn't find a matching pending request
    if (!pendingId || !pendingReply) {
      return;
    }

    // Common cleanup and resolution logic
    this._pendingRepliesMap.delete(pendingId);

    if (message.error) {
      pendingReply.reject(new Error(message.error.title || 'Server error'));
    } else {
      pendingReply.resolve(message as any);
    }
  }
}