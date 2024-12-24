import type {
  IInlineCompletionError,
  IInlineCompletionItem
} from '@jupyterlab/completer';
import type OpenAI from 'openai';

/**
 * AI capabilities.
 */
export interface IAICapabilities {
  /**
   * AI provider configuration schema.
   */
  configuration: Record<string, any>;
  /**
   * AI provider name.
   */
  provider: string;
  /**
   * The type of the message.
   */
  type: 'ai_capabilities';
}

/**
 * Completion error type.
 */
export type CompletionError = {
  /**
   * The type of the error.
   */
  error_type: string;
  /**
   * The title of the error.
   */
  title: string;
  /**
   * The traceback of the error.
   */
  traceback?: string;
  /**
   * A hint to fix the error.
   */
  hint?: string;
};

export type ErrorMessage = CompletionError & {
  /**
   * The type of the message.
   */
  type: 'error';
};

/**
 * Mito AI completion request.
 */
export interface ICompletionRequest {
  /**
   * The type of the message.
   */
  type: string;
  /**
   * The message ID.
   */
  message_id: string;
  /**
   * The chat completion messages history.
   */
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  /**
   * Whether to stream the completion or not.
   */
  stream: boolean;
}

/**
 * A completion suggestion.
 */
export interface ICompletionItem {
  /**
   * The completion text.
   */
  content: string;
  /**
   * Token passed to identify the completion when streaming updates.
   */
  token?: string;
  /**
   * Whether generation of `insertText` is still ongoing. If your provider supports streaming,
   * you can set this to true, which will result in the provider's `stream()` method being called
   * with `token` which has to be set for incomplete completions.
   */
  isIncomplete?: boolean;
  /**
   * This field is marked when an error occurs during a stream or fetch request.
   */
  error?: IInlineCompletionError;
}

/**
 * Mito AI completion reply.
 */
export interface ICompletionReply {
  /**
   * The type of the message.
   */
  type: 'reply';
  /**
   * Completion items.
   */
  items: ICompletionItem[];
  /**
   * The parent message ID.
   */
  parent_id: string;
  /**
   * Error information.
   */
  error?: CompletionError;
}

/**
 * Mito AI completion chunk reply
 */
export interface ICompletionStreamChunk {
  /**
   * The type of the message.
   */
  type: 'chunk';
  /**
   * Completion item.
   */
  chunk: ICompletionItem;
  /**
   * Whether the completion is done or not.
   */
  done: boolean;
  /**
   * The parent message ID.
   */
  parent_id: string;
  /**
   * Error information.
   */
  error?: CompletionError;
}

/**
 * Inline completion stream chunk.
 *
 * For the inline completer, it must contain a field `response` that is an `IInlineCompletionItem`.
 * But we extend it for our internal code to get metadata information from the chunk;
 * in particular, the `done` and `error` fields. But we drop the `chunk` field to
 * avoid confusion with the `response` field.
 */
export interface InlineCompletionStreamChunk
  extends Omit<ICompletionStreamChunk, 'chunk'> {
  /**
   * Completion item.
   */
  response: IInlineCompletionItem;
}

export type CompleterMessage =
  | ErrorMessage
  | IAICapabilities
  | ICompletionReply
  | ICompletionStreamChunk;
