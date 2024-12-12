import type { IInlineCompletionItem } from '@jupyterlab/completer';
import type OpenAI from 'openai';

export type ConnectionMessage = {
  type: 'connection';
  client_id: string;
};

export type CompletionError = {
  type: string;
  title: string;
  traceback: string;
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
 * Mito AI completion reply.
 */
export interface ICompletionReply {
  /**
   * The type of the message.
   */
  type: 'inline_completion';
  /**
   * Completion items.
   */
  items: IInlineCompletionItem[];
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
  type: 'stream';
  /**
   * Completion item.
   */
  chunk: IInlineCompletionItem;
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
 */
export interface InlineCompletionStreamChunk
  extends Omit<ICompletionStreamChunk, 'chunk'> {
  /**
   * Completion item.
   */
  response: IInlineCompletionItem;
}

export type CompleterMessage = ICompletionReply | ICompletionStreamChunk;
