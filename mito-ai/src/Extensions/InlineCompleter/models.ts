import type {
  IInlineCompletionList,
  IInlineCompletionItem
} from '@jupyterlab/completer';

export type ConnectionMessage = {
  type: 'connection';
  client_id: string;
};

export type InlineCompletionRequest = {
  number: number;
  path?: string;
  /* The model has to complete given prefix */
  prefix: string;
  /* The model may consider the following suffix */
  suffix: string;
  mime: string;
  /* Whether to stream the response (if streaming is supported by the model) */
  stream: boolean;
  language?: string;
  cell_id?: string;
};

export type CompletionError = {
  type: string;
  traceback: string;
};

export type InlineCompletionReply = {
  type?: 'inline_completion';
  list: IInlineCompletionList;
  reply_to: number;
  error?: CompletionError;
};

export type InlineCompletionStreamChunk = {
  type: 'stream';
  response: IInlineCompletionItem;
  reply_to: number;
  done: boolean;
  error?: CompletionError;
};

export type CompleterMessage =
  | InlineCompletionReply
  | ConnectionMessage
  | InlineCompletionStreamChunk;
