import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { Signal, Stream, type IStream } from '@lumino/signaling';
import type {
  CompleterMessage,
  InlineCompletionReply,
  InlineCompletionRequest,
  InlineCompletionStreamChunk
} from './models';

const SERVICE_URL = 'mito-ai/inline-completion';

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
 * Inline completion client
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
  }

  /**
   * Initializes the WebSocket connection to the completion backend. Promise is
   * resolved when server acknowledges connection and sends the client ID. This
   * must be awaited before calling any other method.
   */
  async initialize(): Promise<void> {
    await this._initialize();
  }

  /**
   * Sends a message across the WebSocket. Promise resolves to the message ID
   * when the server sends the same message back, acknowledging receipt.
   */
  sendMessage(
    message: InlineCompletionRequest
  ): Promise<InlineCompletionReply> {
    const pendingReply = new PromiseDelegate<InlineCompletionReply>();
    if (this._socket) {
      this._socket.send(JSON.stringify(message));
      this._pendingRepliesMap.set(message.number, pendingReply);
    } else {
      pendingReply.reject(
        new Error('Inline completion websocket not initialized')
      );
    }
    return pendingReply.promise;
  }

  /**
   * Completion chunk stream.
   */
  get stream(): IStream<
    CompletionWebsocketClient,
    InlineCompletionStreamChunk
  > {
    return this._stream;
  }

  /**
   * Whether the completion handler is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose the completion handler.
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

  private _onMessage(message: CompleterMessage): void {
    switch (message.type) {
      case 'connection': {
        this._ready.resolve();
        break;
      }
      case 'stream': {
        this._stream.emit(message);
        break;
      }
      default: {
        const resolver = this._pendingRepliesMap.get(message.reply_to);
        if (resolver) {
          resolver.resolve(message);
          this._pendingRepliesMap.delete(message.reply_to);
        } else {
          console.warn('Unhandled message', message);
        }
        break;
      }
    }
  }

  private _onClose(e: CloseEvent, reject: (reason: unknown) => void) {
    reject(new Error('Inline completion websocket disconnected'));
    console.error('Inline completion websocket disconnected');
    // only attempt re-connect if there was an abnormal closure
    // WebSocket status codes defined in RFC 6455: https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1
    if (e.code === 1006) {
      const delaySeconds = 1;
      console.info(
        `Will try to reconnect mito-ai completions in ${delaySeconds} s.`
      );
      setTimeout(async () => await this._initialize(), delaySeconds * 1000);
    }
  }

  private async _initialize(): Promise<void> {
    if (this.isDisposed) {
      return;
    }
    const promise = new PromiseDelegate<void>();
    this._ready = promise;
    console.log(
      'Creating a new websocket connection for mito-ai inline completions...'
    );
    const { appendToken, token, WebSocket, wsUrl } = this.serverSettings;
    let url = URLExt.join(wsUrl, SERVICE_URL);
    if (appendToken && token !== '') {
      url += `?token=${encodeURIComponent(token)}`;
    }

    const socket = (this._socket = new WebSocket(url));
    socket.onclose = e => this._onClose(e, promise.reject.bind(promise));
    socket.onerror = e => promise.reject(e);
    socket.onmessage = msg => msg.data && this._onMessage(JSON.parse(msg.data));
  }

  private _isDisposed = false;
  private _socket: WebSocket | null = null;
  private _stream = new Stream<
    CompletionWebsocketClient,
    InlineCompletionStreamChunk
  >(this);
  private _ready: PromiseDelegate<void> = new PromiseDelegate<void>();
  /**
   * Dictionary mapping message IDs to Promise resolvers.
   */
  private _pendingRepliesMap = new Map<
    number,
    PromiseDelegate<InlineCompletionReply>
  >();
}
