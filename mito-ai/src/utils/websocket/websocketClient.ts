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

const SERVICE_URL = 'mito-ai/completions';

/**
 * Error thrown by Mito AI completion
 */
export class MitoAIError extends Error {
  name = 'MitoAIError';
  /**
   * Human readable hint to help the user understand the error.
   */
  hint?: string;

  constructor(message: string, options: { cause?: any; hint?: string } = {}) {
    super(message, { cause: options.cause });
    this.hint = options.hint;
    if (options.cause) {
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
    await this._initialize();
  }

  /**
   * Sends a message across the WebSocket. Promise resolves to the message ID
   * when the server sends the same message back, acknowledging receipt.
   * Automatically ensures the websocket is initialized before sending.
   */
  sendMessage<T extends ICompletionRequest, R extends CompleterMessage>(
    message: T
  ): Promise<R> {
    return new Promise<R>(async (resolve, reject) => {
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
            reject(new Error('Failed to reconnect websocket before sending message'));
            return;
          }
        }

        if (this._socket && this._socket.readyState === WebSocket.OPEN) {
          const id = message.message_id ?? crypto.randomUUID();
          const pendingReply = new PromiseDelegate<R>();
          this._pendingRepliesMap.set(
            id,
            pendingReply as PromiseDelegate<CompleterMessage>
          );
          pendingReply.promise.then(resolve).catch(reject);
          
          const messageWithId = { ...message, message_id: id };
          this._socket.send(JSON.stringify(messageWithId));
        } else {
          reject(new Error('Inline completion websocket not initialized'));
        }
      } catch (error) {
        reject(error);
      }
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
        this._stream.emit(message);
        break;
      }
      case 'reply': {
        const resolver = this._pendingRepliesMap.get(message.parent_id);
        if (resolver) {
          resolver.resolve(message);
          this._pendingRepliesMap.delete(message.parent_id);
        } else {
          console.warn('Unhandled mito ai completion message', message);
        }
        break;
      }
      // default: /* no-op */
    }
  }

  private _onOpen(e: Event) {
    console.log('Mito AI completion websocket connected');
    this._ready.resolve();
    this._connectionStatus.emit('connected');
  }

  private _onClose(e: CloseEvent) {
    this._ready.reject(new Error('Completion websocket disconnected'));
    console.error('Completion websocket disconnected');
    this._connectionStatus.emit('disconnected');
  }

  private async _initialize(): Promise<void> {
    if (this.isDisposed || this._socket) {
      return;
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
    const answer = await fetch(
      URLExt.join(this.serverSettings.baseUrl, SERVICE_URL),
      {
        method: 'HEAD',
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
      this._ready.reject(
        new MitoAIError(message, {
          cause: answer,
          hint
        })
      );
      return this._ready.promise;
    }

    const socket = (this._socket = new WebSocket(url));
    socket.onopen = e => {
      this._onOpen(e);
    };
    socket.onclose = e => {
      this._onClose(e);
    };
    socket.onerror = e => {
      this._ready.reject(e);
    };
    socket.onmessage = msg => {
      if (msg.data) {
        this._onMessage(JSON.parse(msg.data));
      }
    };

    await this._ready.promise;
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
   * Attempt to reconnect the websocket with exponential backoff
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
      throw new Error(`Failed to reconnect after ${this._maxReconnectAttempts} attempts`);
    }
    
    // Clean up any existing socket
    if (this._socket) {
      this._socket.close();
      this._socket = null;
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
    } catch (error) {
      console.error(`Reconnection attempt ${this._reconnectAttempt} failed:`, error);
      // Try again recursively with exponential backoff if we haven't exceeded the limit
      if (this._reconnectAttempt < this._maxReconnectAttempts) {
        return this.reconnect(false);
      } else {
        throw error;
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
}
