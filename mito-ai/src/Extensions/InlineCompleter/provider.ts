/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Notification, showErrorMessage } from '@jupyterlab/apputils';
import {
  InlineCompletionTriggerKind,
  type CompletionHandler,
  type IInlineCompletionContext,
  type IInlineCompletionItem,
  type IInlineCompletionList,
  type IInlineCompletionProvider
} from '@jupyterlab/completer';
import type { ISettingRegistry } from '@jupyterlab/settingregistry';
import { PromiseDelegate, type JSONValue } from '@lumino/coreutils';
import type { IDisposable } from '@lumino/disposable';
import { Signal, Stream } from '@lumino/signaling';
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import {
  CompletionWebsocketClient,
  type ICompletionWebsocketClientOptions
} from '../../websockets/completions/CompletionsWebsocketClient';
import type {
  CompletionError,
  ICompletionRequest,
  ICompletionReply,
  ICompletionStreamChunk,
  IInlineCompleterCompletionRequest,
  IInlineCompleterMetadata,
  InlineCompletionStreamChunk
} from '../../websockets/completions/CompletionModels';
import { STRIPE_PAYMENT_LINK } from '../../utils/stripe';
import { FREE_TIER_LIMIT_REACHED_ERROR_TITLE } from '../../utils/errors';

/**
 * Mito AI inline completer
 *
 * It uses a WebSocket connection to request an AI model.
 */
export class MitoAIInlineCompleter
  implements IInlineCompletionProvider, IDisposable {
  private _client: CompletionWebsocketClient;
  private _counter = 0;
  private _isDisposed = false;
  private _settings: MitoAIInlineCompleter.ISettings = MitoAIInlineCompleter.DEFAULT_SETTINGS;
  
  // Store only one inline completion stream
  // Each new request should invalidate any other suggestions.
  private _currentToken = '';
  private _currentStream: Stream<MitoAIInlineCompleter, InlineCompletionStreamChunk> | null = null;
  
  /**
   * Block processing chunks while waiting for the acknowledge request
   * that will provide the unique completion token.
   */
  private _completionLock = new PromiseDelegate<void>();
  private _fullCompletionMap = new WeakMap<Stream<MitoAIInlineCompleter, InlineCompletionStreamChunk>, string>();
  private _contextManager: IContextManager;

  // We only want to display the free tier limit reached notification once 
  // per session to avoid spamming the user. 
  private _displayed_free_tier_limit_reached_notification = false;
  // Similarly, we only want to show the general completion failure notification once
  private _displayed_completion_failure_notification = false;

  // Store the current inline completion
  private _currentCompletionInfo: {
    insertText: string;
    prefix: string;
    suffix: string;
  } = {
    insertText: '',
    prefix: '',
    suffix: ''
  };

  constructor({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    serverSettings, 
    contextManager,
    ...clientOptions
  }: MitoAIInlineCompleter.IOptions) {
    this._contextManager = contextManager;
    this._client = new CompletionWebsocketClient(clientOptions);

    this._client
      .initialize()
      .then(() => {
        this._client.stream.connect(this._receiveStreamChunk, this);
        this._completionLock.resolve();
      })
      .catch(reason => {
        this._completionLock.reject(reason);
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
    this._resetCurrentStream();
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

    if (this.isDisposed) {
      return Promise.reject('Mito AI provider is disposed.');
    }

    // Block processing chunks while waiting for the acknowledge request
    // that will provide the unique completion token.
    await this._completionLock.promise;

    this._completionLock = new PromiseDelegate<void>();
    try {
      // Stop current stream if any
      this._resetCurrentStream();

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
      const messageId = ++this._counter;

      const prefix = this._getPrefix(request);
      const suffix = this._getSuffix(request);

      const metadata: IInlineCompleterMetadata = {
        promptType: 'inline_completion',
        variables: this._contextManager.variables,
        files: this._contextManager.files,
        prefix: prefix,
        suffix: suffix
      }
      const inlineCompleterCompletionRequest: IInlineCompleterCompletionRequest = {
        type: 'inline_completion',
        message_id: messageId.toString(),
        metadata: metadata,
        stream: false,
      }
      const result = await this._client.sendMessage<
        ICompletionRequest,
        ICompletionReply
      >(inlineCompleterCompletionRequest);

      if (result.items[0]?.token) {
        this._currentToken = result.items[0].token;
        this._currentStream = new Stream<
          MitoAIInlineCompleter,
          InlineCompletionStreamChunk
        >(this);
      }

      const error = result.error;
      if (error?.title === FREE_TIER_LIMIT_REACHED_ERROR_TITLE) {
        if (!this._displayed_free_tier_limit_reached_notification) {
          this._notifyFreeTierLimitReached();
          this._displayed_free_tier_limit_reached_notification = true;
        }
      } else if (error) {
        this._notifyCompletionFailure(error);
        throw new Error(
          `Inline completion failed: ${error.error_type}\n${error.traceback}`
        );
      }

      return {
        items: result.items.map(item => {
          const insertText = this._cleanCompletion(item.content, prefix, suffix);
          this._currentCompletionInfo = {
            insertText: insertText,
            prefix: prefix,
            suffix: suffix
          };
          return {
            ...item,
            insertText: insertText
          };
        })
      };
    } finally {
      this._completionLock.resolve();
    }
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
    // Wait for the acknowledge request to be fulfilled before starting the stream
    await this._completionLock.promise;

    if (this._currentToken !== token) {
      // New completion may be triggered before the code have started streaming
      // the previous one. So not raising an error here.
      console.debug(`No stream found for token '${token}'.`);
      return;
    }

    for await (const chunk of this._currentStream!) {
      // If a new completion is triggered, stop the current stream
      // before the backend has finished streaming the full suggestion.
      if (this._currentToken !== token) {
        break;
      }
      yield chunk;
      if (chunk.done || chunk.error) {
        // Break this for loop
        this._currentStream?.stop();
      }
    }
  }

  /**
   * Extract prefix from request, accounting for context window limit.
   *
   * For the case of a cell, this extract all the code of the current cell
   * before the cursor.
   */
  private _getPrefix(request: CompletionHandler.IRequest): string {
    return request.text.slice(0, request.offset);
  }

  /**
   * Extract suffix from request, accounting for context window limit.
   *
   * For the case of a cell, this extract all the code of the current cell
   * after the cursor.
   */
  private _getSuffix(request: CompletionHandler.IRequest): string {
    return request.text.slice(request.offset);
  }

  private _notifyFreeTierLimitReached(): void {
    Notification.emit(`You've used up your free Mito AI completions for this month. Upgrade to Mito Pro or supply your own key.`, 'error', {
      autoClose: false,
      actions: [
        {
          label: 'Upgrade to Mito Pro',
          callback: () => {
            // We create and submit a form programmatically instead of using window.open()
            // because the Stripe endpoint requires a POST request, which window.open() 
            // cannot do (it only makes GET requests). This approach allows us to make
            // a proper POST request that will create a Stripe checkout session.
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = STRIPE_PAYMENT_LINK;
            form.target = '_blank';
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
          }
        },
        {
          label: "Learn more",
          callback: () => {
            window.open("https://www.trymito.io/plans", '_blank');
          }
        }
      ]
    });
  }

  private _notifyCompletionFailure(error: CompletionError): void {
    // Only show the notification if we haven't shown one already
    if (!this._displayed_completion_failure_notification) {
      Notification.emit(`AI code completion failed. We're experiencing some technical difficulties.`, 'error', {
        autoClose: false,
        actions: [
          {
            label: 'Show Technical Details',
            callback: async (event: Event): Promise<void> => {
              // Prevent the default action which might close the notification
              event.preventDefault();
              event.stopPropagation();
              
              // Show the error details in a separate dialog
              await showErrorMessage('Completion Service Error Details', {
                message: error.traceback ?? 'No additional error information is available.'
              });
            }
          },
          {
            label: 'Get Help',
            callback: (): void => {
              // Create the body text with error details
              const bodyText = `Hello Mito team,

I encountered an error while using the AI code completion feature:

Error type: ${error.error_type || 'Unknown'}
${error.traceback ? `\nTraceback:\n${error.traceback}` : ''}

Additional details about what I was doing:
[User can add details here]

Thanks for your help!
`;
              // URL encode the body text
              const encodedBody = encodeURIComponent(bodyText);
              // Open email client with pre-filled recipients, subject, and body
              window.open(`mailto:founders@sagacollab.com?subject=AI%20Completion%20Error%20Support&body=${encodedBody}`, '_blank');
            }
          }
        ]
      });
      // Set the flag to true so we don't show this notification again
      this._displayed_completion_failure_notification = true;
    }
  }

  /**
   * Process the stream chunk to make it available in the awaiting generator.
   */
  private _receiveStreamChunk(
    _emitter: CompletionWebsocketClient,
    chunk: ICompletionStreamChunk
  ): void {

    if (chunk.error?.title === FREE_TIER_LIMIT_REACHED_ERROR_TITLE) {
      this._notifyFreeTierLimitReached();
      this._displayed_free_tier_limit_reached_notification = true;
    } else if (chunk.error) {
      this._notifyCompletionFailure(chunk.error);
    }

    const token = chunk.chunk.token;
    if (!token) {
      throw Error('Stream chunks must define `token` in `chunk`.');
    }

    if (this._currentToken !== token) {
      // This may happen if the backend is still streaming for a previous token
      console.debug(
        `Received completion chunk for an unknown token '${token}'`
      );
      return;
    }

    if (!this._currentStream) {
      throw Error(`Stream not found for token ${token}`);
    }

    let fullCompletion = this._fullCompletionMap.get(this._currentStream) ?? '';
    fullCompletion += chunk.chunk.content;
    this._fullCompletionMap.set(this._currentStream, fullCompletion);

    const cleanedCompletion = this._cleanCompletion(fullCompletion);

    this._currentStream.emit({
      done: chunk.done,
      error: chunk.error,
      parent_id: chunk.parent_id,
      response: {
        insertText: cleanedCompletion,
        isIncomplete: !chunk.done,
        error: chunk.chunk.error,
        token: chunk.chunk.token
      },
      type: chunk.type
    });
  }

  private _cleanCompletion(rawCompletion: string, prefix?: string, suffix?: string): string {

    let cleanedCompletion = rawCompletion
      .replace(/^```python\n?/, '')  // Remove opening code fence with optional python language
      .replace(/```$/, '')           // Remove closing code fence
      .replace(/\n$/, '')    

    // Remove duplicate prefix content
    if (prefix) {
      const lastPrefixLine = prefix.split('\n').slice(-1)[0];
      if (lastPrefixLine && cleanedCompletion.startsWith(lastPrefixLine) && lastPrefixLine !== '') {
        cleanedCompletion = cleanedCompletion.slice(lastPrefixLine.length);
      }
    }

    // Remove duplicate suffix content
    if (suffix) {
      const firstSuffixLine = suffix.split('\n')[0];
      if (firstSuffixLine && cleanedCompletion.endsWith(firstSuffixLine) && firstSuffixLine !== '') {
        cleanedCompletion = cleanedCompletion.slice(0, -firstSuffixLine.length);
      }
    }

    return cleanedCompletion;
  }

  // Get the current completion info, including the completed line.
  // This is used to log the completion info to the backend.
  getCurrentCompletionInfo(): {
    insertText: string;
    prefix: string;
    suffix: string;
    completedCodeCell: string;
  } {
    const completedCodeCell = this._currentCompletionInfo.prefix + this._currentCompletionInfo.insertText + this._currentCompletionInfo.suffix;
    return {
      ...this._currentCompletionInfo,
      completedCodeCell: completedCodeCell
    };
  }

  private _resetCurrentStream(): void {
    this._currentToken = '';
    this._currentCompletionInfo = {
      insertText: '',
      prefix: '',
      suffix: ''
    };
    if (this._currentStream) {
      this._currentStream.stop();
      this._fullCompletionMap.delete(this._currentStream);
      this._currentStream = null;
    }
  }

  /*
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
  */
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace MitoAIInlineCompleter {
  export interface IOptions extends ICompletionWebsocketClientOptions {
    /**
     * CodeMirror language registry.
     */
    contextManager: IContextManager;
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
