import type {
  IInlineCompletionList,
  IInlineCompletionItem
} from '@jupyterlab/completer';

export type ConnectionMessage = {
  type: 'connection';
  client_id: string;
};

export type InlineCompletionRequest = {
  message_id: string;
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
  parent_id: string;
  error?: CompletionError;
};

export type InlineCompletionStreamChunk = {
  type: 'stream';
  response: IInlineCompletionItem;
  parent_id: string;
  done: boolean;
  error?: CompletionError;
};

export type CompleterMessage =
  | InlineCompletionReply
  | ConnectionMessage
  | InlineCompletionStreamChunk;
