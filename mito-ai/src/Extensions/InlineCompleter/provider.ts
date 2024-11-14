import { Notification, showErrorMessage } from '@jupyterlab/apputils';
import { IEditorMimeTypeService } from '@jupyterlab/codeeditor';
import {
  IEditorLanguageRegistry,
  type IEditorLanguage
} from '@jupyterlab/codemirror';
import {
  InlineCompletionTriggerKind,
  type CompletionHandler,
  type IInlineCompletionContext,
  type IInlineCompletionItem,
  type IInlineCompletionList,
  type IInlineCompletionProvider
} from '@jupyterlab/completer';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { NotebookPanel } from '@jupyterlab/notebook';
import type { ISettingRegistry } from '@jupyterlab/settingregistry';
import { type JSONValue } from '@lumino/coreutils';
import type { IDisposable } from '@lumino/disposable';
import { Signal, Stream } from '@lumino/signaling';
import {
  CompletionWebsocketClient,
  type ICompletionWebsocketClientOptions
} from './client';
import type { CompletionError, InlineCompletionStreamChunk } from './models';

/**
 * Mito AI inline completer
 *
 * It uses a WebSocket connection to request an AI model.
 */
export class MitoAIInlineCompleter
  implements IInlineCompletionProvider, IDisposable
{
  private _client: CompletionWebsocketClient;
  private _counter = 0;
  private _isDisposed = false;
  private _languageRegistry: IEditorLanguageRegistry;
  private _settings: MitoAIInlineCompleter.ISettings =
    MitoAIInlineCompleter.DEFAULT_SETTINGS;
  /**
   * Map of stream chunk per completion token.
   */
  private _streamMap = new Map<
    string,
    Stream<MitoAIInlineCompleter, InlineCompletionStreamChunk>
  >();
  private _fullCompletionMap = new WeakMap<
    Stream<MitoAIInlineCompleter, InlineCompletionStreamChunk>,
    string
  >();

  constructor({
    languageRegistry,
    ...clientOptions
  }: MitoAIInlineCompleter.IOptions) {
    this._languageRegistry = languageRegistry;
    this._client = new CompletionWebsocketClient(clientOptions);

    this._client
      .initialize()
      .then(() => {
        this._client.stream.connect(this._receiveStreamChunk, this);
      })
      .catch(reason => {
        console.error(
          'Failed to initialize the websocket connection for ai completions.',
          reason
        );
      });
  }

  /**
   * Completer unique identifier
   */
  readonly identifier: string = 'mito-ai';

  /**
   * Completer name
   */
  readonly name: string = 'Mito AI';

  /**
   * Whether the completer is disposed or not.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Settings schema contributed by provider for user customization.
   */
  get schema(): ISettingRegistry.IProperty {
    return {
      properties: {
        triggerKind: {
          title: 'Inline completions trigger',
          type: 'string',
          oneOf: [
            { const: 'any', title: 'Automatic (on typing or invocation)' },
            { const: 'manual', title: 'Only when invoked manually' }
          ],
          description: 'When to trigger inline completions when using mito-ai.'
        }
      },
      default: MitoAIInlineCompleter.DEFAULT_SETTINGS as any
    };
  }

  /**
   * Callback on user settings changes.
   */
  async configure(settings: { [property: string]: JSONValue }): Promise<void> {
    this._settings = settings as unknown as MitoAIInlineCompleter.ISettings;
  }

  /**
   * Dispose of the resources used by the completer.
   */
  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._client.stream.disconnect(this._receiveStreamChunk, this);
    this._client.dispose();
    for (const stream of this._streamMap.values()) {
      stream.stop();
    }
    this._streamMap.clear();
    Signal.clearData(this);
  }

  /**
   * The method called when user requests inline completions.
   *
   * The implicit request (on typing) vs explicit invocation are distinguished
   * by the value of `triggerKind` in the provided `context`.
   */
  async fetch(
    request: CompletionHandler.IRequest,
    context: IInlineCompletionContext
  ): Promise<IInlineCompletionList<IInlineCompletionItem>> {
    if (!this.isEnabled()) {
      return Promise.reject('Mito AI completion is disabled.');
    }
    const allowedTriggerKind = this._settings.triggerKind;
    const triggerKind = context.triggerKind;
    if (
      allowedTriggerKind === 'manual' &&
      triggerKind !== InlineCompletionTriggerKind.Invoke
    ) {
      // Short-circuit if user requested to only invoke inline completions
      // on manual trigger. Users may still get completions
      // from other (e.g. less expensive or faster) providers.
      return {
        items: []
      };
    }
    const mime = request.mimeType ?? IEditorMimeTypeService.defaultMimeType;
    const language = this._languageRegistry.findByMIME(mime);
    if (!language) {
      console.warn(
        `Could not recognize language for ${mime} - cannot complete`
      );
      return { items: [] };
    }

    let cellId = undefined;
    let path = context.session?.path;
    if (context.widget instanceof NotebookPanel) {
      const activeCell = context.widget.content.activeCell;
      if (activeCell) {
        cellId = activeCell.model.id;
      }
    }
    if (!path && context.widget instanceof DocumentWidget) {
      path = context.widget.context.path;
    }
    const number = ++this._counter;

    const stream = true;

    const result = await this._client.sendMessage({
      path: context.session?.path,
      mime,
      prefix: this._getPrefix(request),
      suffix: this._getSuffix(request),
      language: this._resolveLanguage(language),
      number,
      stream,
      cell_id: cellId
    });

    const error = result.error;
    if (error) {
      this._notifyCompletionFailure(error);
      throw new Error(
        `Inline completion failed: ${error.type}\n${error.traceback}`
      );
    }

    return result.list;
  }

  /**
   * Whether the completer is enabled or not.
   */
  isEnabled(): boolean {
    return this._settings.enabled;
  }

  /**
   * Stream a reply for completion identified by given `token`.
   */
  async *stream(token: string): AsyncGenerator<{
    response: IInlineCompletionItem;
  }> {
    if (!this.isEnabled()) {
      throw new Error('Mito AI completion is disabled.');
    }
    const stream = this._getStream(token);

    try {
      for await (const chunk of stream) {
        yield chunk;
        if (chunk.done) {
          // Break this for loop
          stream.stop();
        }
      }
    } finally {
      this._streamMap.delete(token);
    }
  }

  /**
   * Create a stream for a given completion.
   *
   * @param token Completion unique identifier
   */
  private _getStream(
    token: string
  ): Stream<MitoAIInlineCompleter, InlineCompletionStreamChunk> {
    let stream = this._streamMap.get(token);
    if (!stream) {
      stream = new Stream<MitoAIInlineCompleter, InlineCompletionStreamChunk>(
        this
      );
      this._streamMap.set(token, stream);
    }
    return stream;
  }

  /**
   * Extract prefix from request, accounting for context window limit.
   */
  private _getPrefix(request: CompletionHandler.IRequest): string {
    return request.text.slice(0, request.offset);
  }

  /**
   * Extract suffix from request, accounting for context window limit.
   */
  private _getSuffix(request: CompletionHandler.IRequest): string {
    return request.text.slice(request.offset);
  }

  private _notifyCompletionFailure(error: CompletionError) {
    Notification.emit(`Inline completion failed: ${error.type}`, 'error', {
      autoClose: false,
      actions: [
        {
          label: 'Show Traceback',
          callback: () => {
            showErrorMessage('Inline completion failed on the server side', {
              message: error.traceback
            });
          }
        }
      ]
    });
  }

  /**
   * Process the stream chunk to make it available in the awaiting generator.
   */
  private _receiveStreamChunk(
    _emitter: CompletionWebsocketClient,
    chunk: InlineCompletionStreamChunk
  ) {
    if (chunk.error) {
      this._notifyCompletionFailure(chunk.error);
    }

    const token = chunk.response.token;
    if (!token) {
      throw Error('Stream chunks must define `token` in `response`');
    }
    const stream = this._streamMap.get(token);
    if (!stream) {
      throw Error(`Stream not found for token ${token}`);
    }
    let fullCompletion = this._fullCompletionMap.get(stream) ?? '';
    fullCompletion += chunk.response.insertText;
    this._fullCompletionMap.set(stream, fullCompletion);

    stream.emit({
      ...chunk,
      response: {
        ...chunk.response,
        insertText: fullCompletion
      }
    });
  }

  private _resolveLanguage(language: IEditorLanguage | null) {
    if (!language) {
      return 'plain English';
    }
    if (language.name === 'ipython') {
      return 'python';
    } else if (language.name === 'ipythongfm') {
      return 'markdown';
    }
    return language.name;
  }
}

export namespace MitoAIInlineCompleter {
  export interface IOptions extends ICompletionWebsocketClientOptions {
    /**
     * CodeMirror language registry.
     */
    languageRegistry: IEditorLanguageRegistry;
  }

  export interface ISettings {
    triggerKind: 'any' | 'manual';
    debouncerDelay: number;
    enabled: boolean;
  }

  export const DEFAULT_SETTINGS: ISettings = {
    triggerKind: 'any',
    debouncerDelay: 250,
    enabled: false
  };
}
