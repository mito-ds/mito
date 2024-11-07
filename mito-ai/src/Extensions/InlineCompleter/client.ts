import { IDisposable } from '@lumino/disposable';
import { PromiseDelegate } from '@lumino/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';
import { Signal, ISignal } from '@lumino/signaling';
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
    return this._socket
      ? new Promise(resolve => {
          this._socket!.send(JSON.stringify(message));
          this._replyForResolver.set(message.number, resolve);
        })
      : Promise.reject(
          new Error('Inline completion websocket not initialized')
        );
  }

  /**
   * Signal emitted when a new chunk of completion is streamed.
   */
  get streamed(): ISignal<
    CompletionWebsocketClient,
    InlineCompletionStreamChunk
  > {
    return this._streamed;
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
    Signal.clearData(this);
  }

  private _onMessage(message: CompleterMessage): void {
    switch (message.type) {
      case 'connection': {
        this._initialized.resolve();
        break;
      }
      case 'stream': {
        this._streamed.emit(message);
        break;
      }
      default: {
        if (this._replyForResolver.has(message.reply_to)) {
          this._replyForResolver.get(message.reply_to)?.(message);
          this._replyForResolver.delete(message.reply_to);
        } else {
          console.warn('Unhandled message', message);
        }
        break;
      }
    }
  }

  /**
   * Dictionary mapping message IDs to Promise resolvers.
   */
  private _replyForResolver = new Map<
    number,
    (value: InlineCompletionReply) => void
  >();

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
    this._initialized = promise;
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
  private _streamed = new Signal<
    CompletionWebsocketClient,
    InlineCompletionStreamChunk
  >(this);
  private _initialized: PromiseDelegate<void> = new PromiseDelegate<void>();
}
