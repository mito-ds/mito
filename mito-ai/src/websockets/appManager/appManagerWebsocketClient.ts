/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// appManagerWebSocketClient
import { type IStream } from '@lumino/signaling';
import type {
  IManageAppReply,
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
export class AppManagerWebsocketClient extends BaseWebsocketClient<IAppManagerRequest, IManageAppReply> {
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
  get messages(): IStream<AppManagerWebsocketClient, IManageAppReply> {
    return this._messages as unknown as IStream<AppManagerWebsocketClient, IManageAppReply>;
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
    // Generate a simple ID since we don't have message_id in the request
    return Math.random().toString(36).substring(7);
  }

  /**
   * Process a message received from the websocket.
   */
  protected _onMessage(message: IManageAppReply): void {
    /**
     * Emit the message to interested parties.
     */
    this._messages.emit(message);

    /**
     * For simple app management, we don't need complex message tracking.
     * Just emit any errors through the stream if needed.
     */
    if (message.error) {
      console.error('App manager error:', message.error.title);
    }
  }
}