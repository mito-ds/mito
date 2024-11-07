import {
  IEditorLanguageRegistry,
  type IEditorLanguage
} from '@jupyterlab/codemirror';
import {
  type IInlineCompletionProvider,
  type CompletionHandler,
  type IInlineCompletionContext,
  type IInlineCompletionItem,
  type IInlineCompletionList,
  InlineCompletionTriggerKind
} from '@jupyterlab/completer';
import {
  CompletionWebsocketClient,
  type ICompletionWebsocketClientOptions
} from './client';
import { Notification, showErrorMessage } from '@jupyterlab/apputils';
import { PromiseDelegate, type JSONValue } from '@lumino/coreutils';
import type { CompletionError, InlineCompletionStreamChunk } from './models';
import type { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IEditorMimeTypeService } from '@jupyterlab/codeeditor';
import { NotebookPanel } from '@jupyterlab/notebook';
import { DocumentWidget } from '@jupyterlab/docregistry';
import type { IDisposable } from '@lumino/disposable';

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
  private _streamPromises: Map<
    string,
    PromiseDelegate<InlineCompletionStreamChunk>
  > = new Map();

  constructor({ languageRegistry, ...others }: MitoAIInlineCompleter.IOptions) {
    this._languageRegistry = languageRegistry;
    this._client = new CompletionWebsocketClient(others);

    this._client
      .initialize()
      .then(() => {
        this._client.streamed.connect(this._receiveStreamChunk, this);
      })
      .catch(reason => {
        console.error(
          'Failed to initialize the websocket connection for ai completions.',
          reason
        );
      });
  }

  readonly identifier: string = 'mito-ai';
  readonly name: string = 'Mito AI';

  get isDisposed(): boolean {
    return this._isDisposed;
  }

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
          description:
            'When to trigger inline completions when using jupyter-ai.'
        }
      },
      default: MitoAIInlineCompleter.DEFAULT_SETTINGS as any
    };
  }

  async configure(settings: { [property: string]: JSONValue }): Promise<void> {
    this._settings = settings as unknown as MitoAIInlineCompleter.ISettings;
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._client.streamed.disconnect(this._receiveStreamChunk, this);
    this._client.dispose();
    this._streamPromises.forEach(promise => promise.reject('Disposed'));
    this._streamPromises.clear();
  }

  async fetch(
    request: CompletionHandler.IRequest,
    context: IInlineCompletionContext
  ): Promise<IInlineCompletionList<IInlineCompletionItem>> {
    const allowedTriggerKind = this._settings.triggerKind;
    const triggerKind = context.triggerKind;
    if (
      allowedTriggerKind === 'manual' &&
      triggerKind !== InlineCompletionTriggerKind.Invoke
    ) {
      // Short-circuit if user requested to only invoke inline completions
      // on manual trigger for jupyter-ai. Users may still get completions
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

    if (stream) {
      // Reset stream promises handler
      this._streamPromises.clear();
    }
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
   * Stream a reply for completion identified by given `token`.
   */
  async *stream(
    token: string
  ): AsyncGenerator<InlineCompletionStreamChunk, void, unknown> {
    let done = false;
    while (!done) {
      const delegate = new PromiseDelegate<InlineCompletionStreamChunk>();
      this._streamPromises.set(token, delegate);
      const promise = delegate.promise;
      yield promise;
      done = (await promise).done;
    }
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
    // FIXME we need to merge the stream chunks
    const token = chunk.response.token;
    if (!token) {
      throw Error('Stream chunks must return define `token` in `response`');
    }
    const delegate = this._streamPromises.get(token);
    if (!delegate) {
      console.warn('Unhandled stream chunk');
    } else {
      if (chunk.error) {
        this._notifyCompletionFailure(chunk.error);
        delegate.reject(chunk.error);
      } else {
        delegate.resolve(chunk);
      }
      if (chunk.done) {
        this._streamPromises.delete(token);
      }
    }
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
  }

  export const DEFAULT_SETTINGS: ISettings = {
    triggerKind: 'any'
  };
}
