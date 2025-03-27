import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { ChatHistoryManager, PromptType } from './ChatHistoryManager';
import { ICompletionStreamChunk } from '../../utils/websocket/models';
import { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

/**
 * Represents the current state of the streaming process
 */
export interface IStreamingState {
  isStreamingResponse: boolean;
  streamingDisplay: string;
}

/**
 * Functions for managing streaming state
 */
export interface IStreamingHandlers {
  setIsStreamingResponse: (value: boolean) => void;
  setStreamingDisplay: (value: string) => void;
  setLoadingAIResponse: (value: boolean) => void;
  addAIMessageFromResponseAndUpdateState: (
    messageContent: string,
    promptType: PromptType,
    chatHistoryManager: ChatHistoryManager,
    mitoAIConnectionError?: boolean,
    mitoAIConnectionErrorType?: string | null
  ) => void;
  setChatHistoryManager: (chatHistoryManager: ChatHistoryManager) => void;
}

/**
 * References to mutable state used during streaming
 */
export interface IStreamingRefs {
  streamingMessageIdRef: MutableRefObject<string | null>;
  streamingTextRef: MutableRefObject<string>;
  streamingChatHistoryManagerRef: MutableRefObject<ChatHistoryManager | null>;
  streamingPromptTypeRef: MutableRefObject<PromptType>;
  streamingUpdateTimerRef: MutableRefObject<NodeJS.Timeout | null>;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Clears the update timer if it exists
 */
const _clearUpdateTimer = (streamingRefs: IStreamingRefs): void => {
  if (streamingRefs.streamingUpdateTimerRef.current) {
    clearTimeout(streamingRefs.streamingUpdateTimerRef.current);
    streamingRefs.streamingUpdateTimerRef.current = null;
  }
};

/**
 * Resets all streaming state to initial values
 */
const _resetStreamingState = (
  streamingRefs: IStreamingRefs,
  handlers: Pick<IStreamingHandlers, 'setIsStreamingResponse' | 'setStreamingDisplay'>
): void => {
  handlers.setIsStreamingResponse(false);
  streamingRefs.streamingTextRef.current = '';
  handlers.setStreamingDisplay('');
  streamingRefs.streamingMessageIdRef.current = null;
  streamingRefs.streamingChatHistoryManagerRef.current = null;
  
  _clearUpdateTimer(streamingRefs);
};

// -----------------------------------------------------------------------------
// React Hook for Streaming
// -----------------------------------------------------------------------------

/**
 * Interface for the return value of useStreamingManager hook
 */
export interface IStreamingManagerHook {
  // State
  isStreamingResponse: boolean;
  streamingDisplay: string;
  loadingAIResponse: boolean;

  // Functions
  setLoadingAIResponse: (value: boolean) => void;
  handleStreamChunk: (sender: CompletionWebsocketClient, chunk: ICompletionStreamChunk) => void;
  setupStreamingForRequest: (
    requestId: string,
    chatHistoryManager: ChatHistoryManager,
    promptType: PromptType
  ) => void;
  cleanupStreaming: () => void;
  addAIMessageFromResponseAndUpdateState: (
    messageContent: string,
    promptType: PromptType,
    chatHistoryManager: ChatHistoryManager,
    mitoAIConnectionError?: boolean,
    mitoAIConnectionErrorType?: string | null
  ) => void;

  // Refs for external use if needed
  streamingRefs: IStreamingRefs;
}

/**
 * React hook that provides all streaming functionality
 * 
 * @param websocketClient The websocket client to use for streaming
 * @param onChatHistoryManagerUpdate Callback function to update the chat history manager
 * @returns An object containing all streaming state and functions
 */
export function useStreamingManager(
  websocketClient: CompletionWebsocketClient,
  onChatHistoryManagerUpdate: (chatHistoryManager: ChatHistoryManager) => void
): IStreamingManagerHook {
  // State
  const [isStreamingResponse, setIsStreamingResponse] = useState<boolean>(false);
  const [streamingDisplay, setStreamingDisplay] = useState<string>('');
  const [loadingAIResponse, setLoadingAIResponse] = useState<boolean>(false);

  // Refs
  const streamingMessageIdRef = useRef<string | null>(null);
  const streamingTextRef = useRef<string>('');
  const streamingChatHistoryManagerRef = useRef<ChatHistoryManager | null>(null);
  const streamingPromptTypeRef = useRef<PromptType>('chat');
  const streamingUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Group all refs together for easy passing
  const streamingRefs: IStreamingRefs = {
    streamingMessageIdRef,
    streamingTextRef,
    streamingChatHistoryManagerRef,
    streamingPromptTypeRef,
    streamingUpdateTimerRef,
  };

  // Create streaming handlers object
  const streamingHandlers: IStreamingHandlers = {
    setIsStreamingResponse,
    setStreamingDisplay,
    setLoadingAIResponse,
    addAIMessageFromResponseAndUpdateState: (
      messageContent: string,
      promptType: PromptType,
      chatHistoryManager: ChatHistoryManager,
      mitoAIConnectionError?: boolean,
      mitoAIConnectionErrorType?: string | null
    ) => {
      chatHistoryManager.addAIMessageFromResponse(
        messageContent,
        promptType,
        mitoAIConnectionError,
        mitoAIConnectionErrorType
      );
      onChatHistoryManagerUpdate(chatHistoryManager);
    },
    setChatHistoryManager: onChatHistoryManagerUpdate
  };

  // Create the stream chunk handler function
  const handleStreamChunk = (
    _sender: CompletionWebsocketClient,
    chunk: ICompletionStreamChunk
  ) => {
    // Verify the message belongs to our current stream
    if (streamingMessageIdRef.current !== chunk.parent_id) {
      return; // Not for our current stream, ignore
    }

    // Handle error in the stream
    if (chunk.error) {
      handleStreamError(chunk, streamingRefs, streamingHandlers);
      return;
    }

    // Process normal chunk
    processStreamChunk(chunk, streamingRefs, streamingHandlers);

    // If stream is complete, finalize the response
    if (chunk.done) {
      finalizeStreamResponse(streamingRefs, streamingHandlers);
    }
  };

  // Set up subscription to websocket stream
  useEffect(() => {
    // Subscribe to the stream
    websocketClient.stream.connect(handleStreamChunk);

    // Clean up the subscription when the component unmounts
    return () => {
      websocketClient.stream.disconnect(handleStreamChunk);
      cleanupStreaming();
    };
  }, [websocketClient]);

  // Function to clean up all streaming state
  const cleanupStreaming = () => {
    _resetStreamingState(streamingRefs, {
      setIsStreamingResponse,
      setStreamingDisplay,
    });
    setLoadingAIResponse(false);
  };

  // Function to set up streaming for a new request
  const setupForRequest = (
    requestId: string,
    chatHistoryManager: ChatHistoryManager,
    promptType: PromptType
  ) => {
    setupStreamingForRequest(
      requestId,
      chatHistoryManager,
      promptType,
      streamingRefs,
      { setIsStreamingResponse, setStreamingDisplay }
    );
  };

  // Return all the necessary state and functions
  return {
    // State
    isStreamingResponse,
    streamingDisplay,
    loadingAIResponse,

    // Functions
    setLoadingAIResponse,
    handleStreamChunk,
    setupStreamingForRequest: setupForRequest,
    cleanupStreaming,
    addAIMessageFromResponseAndUpdateState: streamingHandlers.addAIMessageFromResponseAndUpdateState,

    // Refs
    streamingRefs
  };
}

// -----------------------------------------------------------------------------
// Stream Handling Functions
// -----------------------------------------------------------------------------

/**
 * Creates a handler for processing streaming chunks from the websocket
 * 
 * @param streamingRefs References to mutable streaming state
 * @param handlers Functions for updating streaming state
 * @returns A handler function for processing stream chunks
 */
export const createStreamChunkHandler = (
  streamingRefs: IStreamingRefs,
  handlers: IStreamingHandlers
) => {
  return (_sender: CompletionWebsocketClient, chunk: ICompletionStreamChunk) => {
    // Verify the message belongs to our current stream
    if (streamingRefs.streamingMessageIdRef.current !== chunk.parent_id) {
      return; // Not for our current stream, ignore
    }

    // Handle error in the stream
    if (chunk.error) {
      handleStreamError(chunk, streamingRefs, handlers);
      return;
    }

    // Process normal chunk
    processStreamChunk(chunk, streamingRefs, handlers);

    // If stream is complete, finalize the response
    if (chunk.done) {
      finalizeStreamResponse(streamingRefs, handlers);
    }
  };
};

/**
 * Handle an error in the stream
 */
const handleStreamError = (
  chunk: ICompletionStreamChunk,
  streamingRefs: IStreamingRefs,
  handlers: IStreamingHandlers
) => {
  // Keep some destructuring for variables used multiple times
  const { streamingChatHistoryManagerRef, streamingPromptTypeRef } = streamingRefs;

  console.error('[Streaming Error]:', chunk.error);

  // Create appropriate error message
  const errorMessage = chunk.error?.hint
    ? chunk.error.hint
    : `${chunk.error?.error_type || 'Unknown'}: ${chunk.error?.title || 'Unknown Error'}`;

  // Add error message to chat if we have a valid chat history manager
  if (streamingChatHistoryManagerRef.current) {
    handlers.addAIMessageFromResponseAndUpdateState(
      errorMessage,
      streamingPromptTypeRef.current,
      streamingChatHistoryManagerRef.current,
      true,
      chunk.error?.title || null
    );
  }

  // Reset streaming state and loading
  _resetStreamingState(streamingRefs, handlers);
  handlers.setLoadingAIResponse(false);
};

/**
 * Process a normal stream chunk
 */
const processStreamChunk = (
  chunk: ICompletionStreamChunk,
  streamingRefs: IStreamingRefs,
  handlers: IStreamingHandlers
) => {
  // Append new content to the streaming text
  const newText = (chunk.chunk.content || '');
  streamingRefs.streamingTextRef.current += newText;

  // Clear any pending update timer
  _clearUpdateTimer(streamingRefs);

  // Schedule an update with a short debounce to avoid too many renders
  // while still keeping the UI responsive
  streamingRefs.streamingUpdateTimerRef.current = setTimeout(() => {
    handlers.setStreamingDisplay(streamingRefs.streamingTextRef.current);
    streamingRefs.streamingUpdateTimerRef.current = null;
  }, 20);
};

/**
 * Finalize the stream response when complete
 */
const finalizeStreamResponse = (
  streamingRefs: IStreamingRefs,
  handlers: IStreamingHandlers
) => {
  const { streamingChatHistoryManagerRef, streamingPromptTypeRef } = streamingRefs;

  // Immediately update with final text
  handlers.setStreamingDisplay(streamingRefs.streamingTextRef.current);

  // Clear any pending timers
  _clearUpdateTimer(streamingRefs);

  // Update chat history with final response
  if (streamingChatHistoryManagerRef.current) {
    try {
      // Get the final text
      const finalText = streamingRefs.streamingTextRef.current;

      // Update the ChatHistoryManager with the final text
      streamingChatHistoryManagerRef.current.addAIMessageFromResponse(
        finalText,
        streamingPromptTypeRef.current
      );
      handlers.setChatHistoryManager(streamingChatHistoryManagerRef.current);
    } catch (error) {
      console.error('Error finalizing streaming response:', error);
    }
  } else {
    console.warn('Chat history manager not available at stream completion');
  }

  // Reset streaming state and loading
  _resetStreamingState(streamingRefs, handlers);
  handlers.setLoadingAIResponse(false);
};

/**
 * Clean up function to reset all streaming-related state
 */
export const cleanupStreamingState = (
  streamingRefs: IStreamingRefs,
  handlers: Pick<IStreamingHandlers, 'setIsStreamingResponse' | 'setStreamingDisplay'>
) => {
  _resetStreamingState(streamingRefs, handlers);
};

/**
 * Setup streaming for a new request
 * 
 * @param requestId The ID of the request to stream
 * @param chatHistoryManager Manager for chat history
 * @param promptType Type of prompt being used
 * @param streamingRefs References to streaming state
 * @param handlers Functions to update state
 */
export const setupStreamingForRequest = (
  requestId: string,
  chatHistoryManager: ChatHistoryManager,
  promptType: PromptType,
  streamingRefs: IStreamingRefs,
  handlers: Pick<IStreamingHandlers, 'setIsStreamingResponse' | 'setStreamingDisplay'>
) => {
  // Reset text and display
  streamingRefs.streamingTextRef.current = '';
  handlers.setStreamingDisplay('');
  
  // Set new state values
  streamingRefs.streamingMessageIdRef.current = requestId;
  streamingRefs.streamingChatHistoryManagerRef.current = chatHistoryManager;
  streamingRefs.streamingPromptTypeRef.current = promptType;

  // Now that we've set up the streaming, mark it as active
  handlers.setIsStreamingResponse(true);
}; 