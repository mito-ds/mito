import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { Signal, Stream, type IStream } from '@lumino/signaling';
import type {
  CompleterMessage,
  ICompletionReply,
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
   */
  sendMessage(message: ICompletionRequest): Promise<ICompletionReply> {
    const pendingReply = new PromiseDelegate<ICompletionReply>();
    if (this._socket) {
      this._socket.send(JSON.stringify(message));
      this._pendingRepliesMap.set(message.message_id, pendingReply);
    } else {
      pendingReply.reject(
        new Error('Inline completion websocket not initialized')
      );
    }
    return pendingReply.promise;
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
  }

  private _onClose(e: CloseEvent) {
    this._ready.reject(new Error('Completion websocket disconnected'));
    console.error('Completion websocket disconnected');
    // only attempt re-connect if there was an abnormal closure
    // WebSocket status codes defined in RFC 6455: https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1
    if (e.code === 1006) {
      const delaySeconds = 1;
      console.info(
        `Will try to reconnect mito-ai completions in ${delaySeconds} s.`
      );
      setTimeout(async () => {
        this._ready = new PromiseDelegate<void>();
        await this._initialize();
      }, delaySeconds * 1000);
    }
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
    PromiseDelegate<ICompletionReply>
  >();
}
