/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import OpenAI from "openai";
import type {
  IInlineCompletionError,
  IInlineCompletionItem
} from '@jupyterlab/completer';
import { Variable } from '../../Extensions/ContextManager/VariableInspector';
import { File } from '../../Extensions/ContextManager/FileInspector';

/* 

Notebook representation sent to the AI

*/
export type AIOptimizedCell = {
  cell_type: string,
  id: string,
  code: string
}

export type CellUpdateModification = {
  type: 'modification'
  id: string,
  code: string,
  cell_type: 'code' | 'markdown',
}

export type CellUpdateNew = {
  type: 'new'
  index: number,
  code: string,
  cell_type: 'code' | 'markdown',
}

export type CellUpdate = CellUpdateModification | CellUpdateNew

export type AgentResponse = {
  type: 'cell_update' | 'get_cell_output' | 'finished_task'
  message: string,
  cell_update?: CellUpdate,
  cell_id?: string,
}

/* 

Metadata Models

*/

type CompletionRequestMetadata =
  IChatMessageMetadata |
  ISmartDebugMetadata |
  ICodeExplainMetadata |
  IInlineCompleterMetadata |
  IFetchHistoryMetadata |
  IStartNewChatMetadata |
  IGetThreadsMetadata |
  IDeleteThreadMetadata |
  IAgentExecutionMetadata | 
  IAgentSmartDebugMetadata

export interface IChatMessageMetadata {
  promptType: 'chat'
  variables?: Variable[];
  files?: File[];
  activeCellCode: string;
  activeCellId: string;
  base64EncodedActiveCellOutput?: string;
  input: string;
  index?: number;
  threadId: string;
  selectedRules?: string[];
}

export interface IAgentExecutionMetadata {
  promptType: 'agent:execution'
  aiOptimizedCells: AIOptimizedCell[]
  base64EncodedActiveCellOutput?: string;
  variables?: Variable[];
  files?: File[];
  input: string;
  index?: number;
  threadId: string;
  isChromeBrowser: boolean;
  selectedRules?: string[];
}

export interface IAgentSmartDebugMetadata {
  promptType: 'agent:autoErrorFixup'
  aiOptimizedCells: AIOptimizedCell[]
  variables?: Variable[];
  files?: File[];
  errorMessage: string;
  error_message_producing_code_cell_id: string
  threadId: string;
  isChromeBrowser: boolean;
}


export interface ISmartDebugMetadata {
  promptType: 'smartDebug'
  variables?: Variable[];
  files?: File[];
  activeCellCode: string;
  activeCellId: string;
  errorMessage: string;
  threadId: string;
}

export interface ICodeExplainMetadata {
  promptType: 'codeExplain';
  variables?: Variable[];
  activeCellCode?: string;
  threadId: string;
}

export interface IInlineCompleterMetadata {
  promptType: 'inline_completion';
  variables?: Variable[];
  files?: File[];
  prefix: string;
  suffix: string;
}

export interface IFetchHistoryMetadata {
  promptType: 'fetch_history'
  thread_id: string;
}

export interface IStartNewChatMetadata {
  promptType: 'start_new_chat'
}

export interface IGetThreadsMetadata {
  promptType: 'get_threads'
}

export interface IDeleteThreadMetadata {
  promptType: 'delete_thread'
  thread_id: string;
}

/* 

Completion Request Models

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
   * The metadata containing structured data for backend prompt generation.
   */
  metadata: CompletionRequestMetadata;
  /**
   * Whether to stream the completion or not.
   */
  stream: boolean;
}


export interface IChatCompletionRequest extends ICompletionRequest {
  type: 'chat',
  metadata: IChatMessageMetadata
}

export interface ISmartDebugCompletionRequest extends ICompletionRequest {
  type: 'smartDebug'
  metadata: ISmartDebugMetadata
}

export interface IAgentAutoErrorFixupCompletionRequest extends ICompletionRequest {
  type: 'agent:autoErrorFixup'
  metadata: IAgentSmartDebugMetadata
}

export interface ICodeExplainCompletionRequest extends ICompletionRequest {
  type: 'codeExplain'
  metadata: ICodeExplainMetadata
}

export interface IAgentExecutionCompletionRequest extends ICompletionRequest {
  type: 'agent:execution'
  metadata: IAgentExecutionMetadata
}

export interface IInlineCompleterCompletionRequest extends ICompletionRequest {
  type: 'inline_completion'
  metadata: IInlineCompleterMetadata
}

export interface IFetchHistoryCompletionRequest extends ICompletionRequest {
  type: 'fetch_history'
  metadata: IFetchHistoryMetadata
}

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

/**
 * Chat thread item information.
 */
export interface IChatThreadMetadataItem {
  /**
   * Unique thread identifier.
   */
  thread_id: string;

  /**
   * Display name of the thread.
   */
  name: string;

  /**
   * Thread creation timestamp.
   */
  creation_ts: number;

  /**
   * Last interaction timestamp.
   */
  last_interaction_ts: number;
}

/**
 * Response for fetching chat history.
 */
export interface IFetchHistoryReply {
  /**
   * The type of the message.
   */
  type: 'fetch_history';

  /**
   * The parent message ID.
   */
  parent_id: string;

  /**
   * List of chat messages.
   */
  items: OpenAI.Chat.ChatCompletionMessageParam[];
}

/**
 * Response for starting a new chat.
 */
export interface IStartNewChatReply {
  /**
   * The type of the message.
   */
  type: 'start_new_chat';

  /**
   * The parent message ID.
   */
  parent_id: string;

  /**
   * New thread ID.
   */
  thread_id: string;
}

/**
 * Response for fetching chat threads.
 */
export interface IFetchThreadsReply {
  /**
   * The type of the message.
   */
  type: 'fetch_threads';

  /**
   * The parent message ID.
   */
  parent_id: string;

  /**
   * List of chat threads.
   */
  threads: IChatThreadMetadataItem[];
}

/**
 * Response for deleting a chat thread.
 */
export interface IDeleteThreadReply {
  /**
   * The type of the message.
   */
  type: 'delete_thread';

  /**
   * The parent message ID.
   */
  parent_id: string;

  /**
   * Success status.
   */
  success: boolean;
}

export type CompleterMessage =
  | ErrorMessage
  | IAICapabilities
  | ICompletionReply
  | ICompletionStreamChunk
  | IFetchHistoryReply
  | IStartNewChatReply
  | IFetchThreadsReply
  | IDeleteThreadReply;