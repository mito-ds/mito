/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { Signal, Stream, type IStream } from '@lumino/signaling';
import type {
  CompleterMessage,
  ICompletionRequest,
  ICompletionStreamChunk
} from './models';

const SERVICE_URL = 'mito_ai/completions';

/**
 * Error thrown by Mito AI completion
 */
export class MitoAIError extends Error {
  name = 'MitoAIError';
  /**
   * Human readable hint to help the user understand the error.
   */
  hint?: string;

  constructor(message: string, options: { cause?: unknown; hint?: string } = {}) {
    super(message, { cause: options.cause });
    this.hint = options.hint;
    if (options.cause && typeof options.cause === 'object' && 'stack' in options.cause) {
      this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
    }
  }
}

/**
 * The instantiation options for the inline completion client.
 */
export interface ICompletionWebsocketClientOptions {
  /**
   * Jupyter server settings.
   */
  serverSettings?: ServerConnection.ISettings;
}

/**
 * Mito AI completion client
 *
 * It communicates with the backend over a WebSocket to allow streaming answer.
 */
export class CompletionWebsocketClient implements IDisposable {
  /**
   * The server settings used to make API requests.
   */
  readonly serverSettings: ServerConnection.ISettings;

  /**
   * Create a new completion client.
   */
  constructor(options: ICompletionWebsocketClientOptions = {}) {
    this.serverSettings =
      options.serverSettings ?? ServerConnection.makeSettings();
    this._ready = new PromiseDelegate<void>();
  }

  /**
   * Whether the websocket client is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Completion chunk stream.
   */
  get messages(): IStream<CompletionWebsocketClient, CompleterMessage> {
    return this._messages;
  }

  /**
   * Completion chunk stream.
   */
  get stream(): IStream<CompletionWebsocketClient, ICompletionStreamChunk> {
    return this._stream;
  }

  /**
   * Promise that resolves when the websocket connection is ready.
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * Stream of connection status events
   */
  get connectionStatus(): IStream<CompletionWebsocketClient, 'connected' | 'disconnected'> {
    return this._connectionStatus;
  }

  /**
   * Check if websocket is currently connected
   */
  get isConnected(): boolean {
    return this._socket !== null && this._socket.readyState === WebSocket.OPEN;
  }

  /**
   * Dispose the websocket client.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;

    // Clean up socket.
    const socket = this._socket;
    if (socket) {
      this._socket = null;
      socket.onopen = () => undefined;
      socket.onerror = () => undefined;
      socket.onmessage = () => undefined;
      socket.onclose = () => undefined;
      socket.close();
    }

    this._stream.stop();
    for (const resolver of this._pendingRepliesMap.values()) {
      resolver.reject(new Error('Completion websocket client disposed'));
    }
    this._pendingRepliesMap.clear();
    Signal.clearData(this);
  }

  /**
   * Initializes the WebSocket connection to the completion backend. This
   * must be awaited before calling any other method.
   */
  async initialize(): Promise<void> {
    try {
      await this._initialize();
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      throw error;
    }
  }

  /**
   * Sends a message across the WebSocket. Promise resolves to the message ID
   * when the server sends the same message back, acknowledging receipt.
   * Automatically ensures the websocket is initialized before sending.
   */
  sendMessage<T extends ICompletionRequest, R extends CompleterMessage>(
    message: T
  ): Promise<R> {
    // Create a Promise for the eventual result
    return new Promise<R>((resolve, reject) => {
      // First check if we need to reconnect
      void Promise.resolve().then(async () => {
        try {
          // If the socket is not connected, try to reconnect first
          if (this._socket === null || this._socket.readyState !== WebSocket.OPEN) {
            try {
              console.log('Connection is closed, attempting to reconnect before sending message...');
              
              // Reset the ready promise since we're going to reconnect
              this._ready = new PromiseDelegate<void>();
              
              await this.reconnect();
              console.log('Successfully reconnected, now sending message');
            } catch (reconnectError) {
              console.error('Failed to reconnect websocket:', reconnectError);
              // If the error is a MitoAIError, propagate it directly to preserve the helpful message
              if (reconnectError instanceof MitoAIError) {
                reject(reconnectError);
              } else {
                reject(new Error('Failed to reconnect websocket before sending message'));
              }
              return;
            }
          }

          if (this._socket && this._socket.readyState === WebSocket.OPEN) {
            const pendingReply = new PromiseDelegate<R>();
            this._pendingRepliesMap.set(
              message.message_id,
              pendingReply as PromiseDelegate<CompleterMessage>
            );
            pendingReply.promise.then(resolve).catch(reject);
            // Send the message
            this._socket.send(JSON.stringify(message));
          } else {
            reject(new Error('Inline completion websocket not initialized'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private _onMessage(message: CompleterMessage): void {
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

  private _onOpen(_: Event): void {
    console.log('Mito AI completion websocket connected');
    this._ready.resolve();
    this._connectionStatus.emit('connected');
  }

  private _onClose(_e: CloseEvent): void {
    this._ready.reject(new Error('Completion websocket disconnected'));
    console.error('Completion websocket disconnected');
    this._connectionStatus.emit('disconnected');
  }

  private async _initialize(): Promise<void> {
    if (this.isDisposed) {
      return;
    }
    
    // If we already have a pending initialization, return that
    if (this._initializationInProgress) {
      return this._ready.promise;
    }
    
    // Mark that initialization is in progress to prevent multiple concurrent initializations
    this._initializationInProgress = true;
    
    // Always create a new ready promise to ensure we're starting fresh
    this._ready = new PromiseDelegate<void>();
    
    // Clean up any existing socket first
    if (this._socket) {
      const oldSocket = this._socket;
      this._socket = null;
      
      // Clear handlers before closing to prevent triggering unintended events
      oldSocket.onopen = () => undefined;
      oldSocket.onerror = () => undefined;
      oldSocket.onmessage = () => undefined;
      oldSocket.onclose = () => undefined;
      
      // Close the socket
      oldSocket.close();
    }

    console.log(
      'Creating a new websocket connection for mito-ai completions...'
    );
    const { appendToken, token, WebSocket, wsUrl } = this.serverSettings;
    let url = URLExt.join(wsUrl, SERVICE_URL);
    if (appendToken && token !== '') {
      url += `?token=${encodeURIComponent(token)}`;
    }

    // Check if the service is available before attempting to connect
    try {
      const answer = await fetch(
        URLExt.join(this.serverSettings.baseUrl, `${SERVICE_URL}?check_availability=true`),
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `token ${token}`
          }
        }
      );

      if (!answer.ok) {
        const message =
          answer.status == 404
            ? 'Mito AI extension not enabled.'
            : `Mito AI completion not available; error ${answer.status} ${answer.statusText}`;
        const hint =
          answer.status == 404
            ? 'You can enable it by running in a cell `!jupyter server extension enable mito_ai`. Then restart the application.'
            : undefined;
        this._messages.emit({
          type: 'error',
          error_type: 'HTTPError',
          title: message,
          hint
        });
        
        const error = new MitoAIError(message, {
          cause: answer,
          hint
        });
        
        this._ready.reject(error);
        this._initializationInProgress = false;
        return this._ready.promise;
      }

      const socket = (this._socket = new WebSocket(url));
      
      // Set a timeout to detect stalled connections
      const connectionTimeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN && socket === this._socket) {
          console.error('WebSocket connection timed out');
          socket.close();
        }
      }, 10000); // 10 second timeout
      
      socket.onopen = e => {
        clearTimeout(connectionTimeout);
        this._onOpen(e);
        this._initializationInProgress = false;
      };
      socket.onclose = e => {
        clearTimeout(connectionTimeout);
        this._onClose(e);
        this._initializationInProgress = false;
      };
      socket.onerror = e => {
        clearTimeout(connectionTimeout);
        this._ready.reject(e);
        this._initializationInProgress = false;
      };
      socket.onmessage = msg => {
        if (msg.data) {
          this._onMessage(JSON.parse(msg.data));
        }
      };

      return this._ready.promise;
    } catch (error) {
      this._initializationInProgress = false;
      this._ready.reject(error);
      throw error;
    }
  }

  /**
   * Maximum number of reconnection attempts
   */
  private _maxReconnectAttempts = 5;

  /**
   * Current reconnection attempt
   */
  private _reconnectAttempt = 0;

  /**
   * Attempt to reconnect the websocket with exponential backoff.
   * @param forceReset - If true (default), resets the reconnection attempt counter to 0,
   * effectively starting a fresh sequence of reconnection attempts. When false, maintains
   * the current attempt count, which is used during recursive reconnection attempts within the method.
   * @returns Promise that resolves when reconnection is successful or rejects after max attempts
   * @throws Error if the client is disposed or max reconnection attempts are exceeded
   */
  async reconnect(forceReset: boolean = true): Promise<void> {
    if (this._isDisposed) {
      throw new Error('Client is disposed');
    }
    
    // Reset _reconnectAttempt if this is a manual reconnect
    if (forceReset) {
      this._reconnectAttempt = 0;
    }
    
    if (this._reconnectAttempt >= this._maxReconnectAttempts) {
      this._reconnectAttempt = 0; // Reset for future attempts
      throw new MitoAIError(`Failed to reconnect after ${this._maxReconnectAttempts} attempts`);
    }
    
    // Calculate delay using exponential backoff
    // First attempt is immediate, then 1s, 2s, 4s, 8s
    const delay = this._reconnectAttempt === 0 ? 0 : Math.pow(2, this._reconnectAttempt - 1) * 1000;
    
    if (delay > 0) {
      console.log(`Attempting to reconnect in ${delay / 1000}s (attempt ${this._reconnectAttempt + 1}/${this._maxReconnectAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this._reconnectAttempt++;
    
    try {
      // Reinitialize connection
      await this._initialize();
      // Reset reconnect attempt counter on success
      this._reconnectAttempt = 0;
      return;
    } catch (error) {
      console.error(`Reconnection attempt ${this._reconnectAttempt} failed:`, error);
      
      // If the error is a MitoAIError (like the extension not being enabled),
      // propagate it immediately instead of retrying
      if (error instanceof MitoAIError) {
        this._reconnectAttempt = 0; // Reset for future attempts
        throw error;
      }
      
      // If we haven't reached max attempts, try again
      if (this._reconnectAttempt < this._maxReconnectAttempts) {
        return this.reconnect(false);
      } else {
        this._reconnectAttempt = 0; // Reset for future attempts
        throw new MitoAIError(`Failed to reconnect after ${this._maxReconnectAttempts} attempts`, {
          cause: error
        });
      }
    }
  }

  private _isDisposed = false;
  private _messages = new Stream<CompletionWebsocketClient, CompleterMessage>(
    this
  );
  private _socket: WebSocket | null = null;
  private _stream = new Stream<
    CompletionWebsocketClient,
    ICompletionStreamChunk
  >(this);
  private _ready: PromiseDelegate<void> = new PromiseDelegate<void>();
  /**
   * Dictionary mapping message IDs to Promise resolvers.
   */
  private _pendingRepliesMap = new Map<
    string,
    PromiseDelegate<CompleterMessage>
  >();
  private _connectionStatus = new Stream<CompletionWebsocketClient, 'connected' | 'disconnected'>(this);
  
  /**
   * Flag to track if initialization is in progress to prevent multiple concurrent initializations
   */
  private _initializationInProgress = false;
}
