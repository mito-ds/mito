/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type {
  CompleterMessage,
  ICompletionRequest,
  ICompletionStreamChunk,
  IRequestToolExecutionMessage,
  IAgentFinishedMessage,
  IAssistantResponseMessage,
  IToolResultMessage,
} from './CompletionModels';
import { BaseWebsocketClient, IBaseWebsocketClientOptions } from '../BaseWebsocketClient';
import { IStream, Stream } from '@lumino/signaling';
import { isElectronBasedFrontend } from '../../utils/user';

/**
 * The instantiation options for the inline completion client.
 */
export interface ICompletionWebsocketClientOptions extends IBaseWebsocketClientOptions {}

/**
 * Mito AI completion client
 *
 * It communicates with the backend over a WebSocket to allow streaming answer.
 */
export class CompletionWebsocketClient extends BaseWebsocketClient<ICompletionRequest, CompleterMessage, ICompletionStreamChunk> {
  /**
   * The service URL for the websocket endpoint.
   */
  protected readonly SERVICE_URL = 'mito-ai/completions';
  
  public readonly isElectron: boolean;

  /**
   * Create a new completion client.
   */
  constructor(options: ICompletionWebsocketClientOptions = {}) {
    super(options);
    this.isElectron = isElectronBasedFrontend()
  }

  /**
   * Completion chunk stream.
   */
  get messages(): IStream<CompletionWebsocketClient, CompleterMessage> {
    return this._messages as unknown as IStream<CompletionWebsocketClient, CompleterMessage>;
  }

  /**
   * Completion chunk stream.
   */
  get stream(): IStream<CompletionWebsocketClient, ICompletionStreamChunk> {
    return this._stream as unknown as IStream<CompletionWebsocketClient, ICompletionStreamChunk>;
  }

  /**
   * Stream of connection status events
   */
  get connectionStatus(): IStream<CompletionWebsocketClient, 'connected' | 'disconnected'> {
    return this._connectionStatus as unknown as IStream<CompletionWebsocketClient, 'connected' | 'disconnected'>;
  }

  /**
   * Stream of request_tool_execution messages from the backend agent loop.
   */
  get requestToolExecutionMessages(): IStream<CompletionWebsocketClient, IRequestToolExecutionMessage> {
    return this._requestToolExecutionMessages as unknown as IStream<CompletionWebsocketClient, IRequestToolExecutionMessage>;
  }

  /**
   * Stream of agent_finished messages from the backend agent loop.
   */
  get agentFinished(): IStream<CompletionWebsocketClient, IAgentFinishedMessage> {
    return this._agentFinished as unknown as IStream<CompletionWebsocketClient, IAgentFinishedMessage>;
  }

  /**
   * Stream of assistant_response messages from the backend agent loop.
   */
  get assistantResponse(): IStream<CompletionWebsocketClient, IAssistantResponseMessage> {
    return this._assistantResponse as unknown as IStream<CompletionWebsocketClient, IAssistantResponseMessage>;
  }

  /**
   * Stream of backend tool_result messages from the backend agent loop.
   */
  get backendToolResult(): IStream<CompletionWebsocketClient, IToolResultMessage> {
    return this._backendToolResult as unknown as IStream<CompletionWebsocketClient, IToolResultMessage>;
  }

  /**
   * Extract the message ID from a request message.
   */
  protected getMessageId(message: ICompletionRequest): string {
    return message.message_id;
  }

  /**
   * Process a message received from the websocket.
   */
  protected _onMessage(message: CompleterMessage): void {
    /**
     * Emit unconditionally the message to interested parties.
     */
    this._messages.emit(message);

    /**
     * Dispatch completion messages
     */
    switch (message.type) {
      case 'chunk': {
        // To see the stream in action, uncomment the following line
        // console.log(`[Mito AI Stream] ${message.done ? 'FINAL' : ''} Chunk:`, message.chunk.content);
        this._stream.emit(message);
        break;
      }
      case 'reply': {
        const resolver = this._pendingRepliesMap.get(message.parent_id);
        if (resolver) {
          resolver.resolve(message);
          this._pendingRepliesMap.delete(message.parent_id);
        } else {
          // For streaming responses, emit the error through the stream
          // We need to do this here because errors do not come in as "chunk" messages
          // they come in as "reply" messages.
          if (message.error) {
            this._stream.emit({
              type: 'chunk',
              chunk: { content: message.error.hint || message.error.title || "An error occurred" },
              done: true,
              parent_id: message.parent_id,
              error: message.error
            });
          }
          // This will get triggered when streaming and there is an error message.
          // However, errors are handled via the emit seen above above.
          console.warn('Unhandled mito ai completion message', message);
        }
        break;
      }
      case 'request_tool_execution': {
        this._requestToolExecutionMessages.emit(message);
        break;
      }
      case 'agent_finished': {
        this._agentFinished.emit(message);
        break;
      }
      case 'assistant_response': {
        this._assistantResponse.emit(message);
        break;
      }
      case 'tool_result': {
        this._backendToolResult.emit(message);
        break;
      }
      // default: /* no-op */
    }
  }

  private _requestToolExecutionMessages = new Stream<BaseWebsocketClient<ICompletionRequest, CompleterMessage, ICompletionStreamChunk>, IRequestToolExecutionMessage>(this);
  private _agentFinished = new Stream<BaseWebsocketClient<ICompletionRequest, CompleterMessage, ICompletionStreamChunk>, IAgentFinishedMessage>(this);
  private _assistantResponse = new Stream<BaseWebsocketClient<ICompletionRequest, CompleterMessage, ICompletionStreamChunk>, IAssistantResponseMessage>(this);
  private _backendToolResult = new Stream<BaseWebsocketClient<ICompletionRequest, CompleterMessage, ICompletionStreamChunk>, IToolResultMessage>(this);

  /**
   * Send a message without waiting for a reply (fire-and-forget).
   * Used for tool_result messages where the backend doesn't send a reply.
   */
  sendOneWay<T extends ICompletionRequest>(message: T): void {
    const messageWithEnvironment = {
      ...message,
      environment: {
        isElectron: this.isElectron,
      }
    };

    if (this._socket && this._socket.readyState === WebSocket.OPEN) {
      this._socket.send(JSON.stringify(messageWithEnvironment));
    } else {
      console.error('Cannot send one-way message: websocket not connected');
    }
  }

  // Override sendMessage to automatically add environment info
  sendMessage<T extends ICompletionRequest, R extends CompleterMessage>(message: T): Promise<R> {
    // Add environment info to all messages
    const messageWithEnvironment = {
      ...message,
      environment: {
        isElectron: this.isElectron,
      }
    };
    
    return super.sendMessage(messageWithEnvironment);
  }
}
