/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useRef } from 'react';
import type { CompletionWebsocketClient } from '../../../websockets/completions/CompletionsWebsocketClient';
import { ICompletionStreamChunk } from '../../../websockets/completions/CompletionModels';

/**
 * Hook to manage streaming response refs for the chat taskpane.
 * 
 * Provides refs for:
 * - streamingContentRef: Accumulates streaming content as it arrives
 * - streamHandlerRef: Stores the current stream handler function for cleanup
 * - activeRequestControllerRef: Tracks the active AbortController for request cancellation
 * 
 * @returns Object containing:
 *   - streamingContentRef: Ref to accumulate streaming content
 *   - streamHandlerRef: Ref to store the stream handler function
 *   - activeRequestControllerRef: Ref to track active request controller
 */
export const useStreamingResponse = (): {
    streamingContentRef: React.MutableRefObject<string>;
    streamHandlerRef: React.MutableRefObject<((sender: CompletionWebsocketClient, chunk: ICompletionStreamChunk) => void) | null>;
    activeRequestControllerRef: React.MutableRefObject<AbortController | null>;
} => {
    const streamingContentRef = useRef<string>('');
    const streamHandlerRef = useRef<((sender: CompletionWebsocketClient, chunk: ICompletionStreamChunk) => void) | null>(null);
    const activeRequestControllerRef = useRef<AbortController | null>(null);

    return {
        streamingContentRef,
        streamHandlerRef,
        activeRequestControllerRef,
    };
};

