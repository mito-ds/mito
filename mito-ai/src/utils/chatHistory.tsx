/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { IDisplayOptimizedChatItem } from '../Extensions/AiChat/ChatHistoryManager';
import { getContentStringFromMessage } from './strings';
import { isErrorFixupMessage } from './errors';

export type GroupedErrorMessages = IDisplayOptimizedChatItem[]

/**
 * Processes chat history to group consecutive error fixup messages together.
 * This helps in displaying error messages and their responses as a single unit in the UI.
 * 
 * @param displayOptimizedChatHistory - The original chat history to process
 * @returns An array where error fixup messages and their responses are grouped together, 
 *          while other messages remain as individual items
 */
export const processChatHistoryForErrorGrouping = (
    displayOptimizedChatHistory: IDisplayOptimizedChatItem[]
): (GroupedErrorMessages | IDisplayOptimizedChatItem)[] => {
    const processedDisplayOptimizedChatHistory: (GroupedErrorMessages | IDisplayOptimizedChatItem)[] = [];
    let groupedErrorMessages: GroupedErrorMessages = [];

    for (let i = 0; i < displayOptimizedChatHistory.length; i++) {
        let displayOptimizedChatItem = displayOptimizedChatHistory[i];
        if (!displayOptimizedChatItem) {
            continue;
        }

        // Associate scratchpad results with their corresponding scratchpad tool calls
        // The scratchpad result is stored in the next message (the user message that follows the AI's scratchpad response)
        if (displayOptimizedChatItem.agentResponse?.type === 'scratchpad') {
            const nextIndex = i + 1;
            if (nextIndex < displayOptimizedChatHistory.length) {
                const nextItem = displayOptimizedChatHistory[nextIndex];
                if (nextItem?.scratchpadResult) {
                    displayOptimizedChatItem = {
                        ...displayOptimizedChatItem,
                        scratchpadResult: nextItem.scratchpadResult
                    };
                }
            }
        }

        const messageContent = getContentStringFromMessage(displayOptimizedChatItem.message);
        const _isErrorFixupMessage = isErrorFixupMessage(
            displayOptimizedChatItem.promptType, 
            displayOptimizedChatItem.message, 
            messageContent
        );

        if (_isErrorFixupMessage) {
            // If the current message is an error fixup message, we add it to the current group.
            // This allows consecutive error/cell_update cycles to be grouped together, which
            // results in a collapsed UI that keeps the error-fixing flow out of the way for users.
            // For example: [error1, cellUpdate1, error2, askUserQuestion] →
            //   [[error1, cellUpdate1, error2], askUserQuestion]
            // All the error-fixing is grouped together, and askUserQuestion displays separately with its UI.
            groupedErrorMessages.push(displayOptimizedChatItem);
            
            // Note: We check that the next message is an ai response to the error fixup message.
            // If the user has stopped the agent, it might not be an ai response to the error fixup message.

            const next_index = i + 1;
            const nextItem = displayOptimizedChatHistory[next_index];
            if (
                next_index < displayOptimizedChatHistory.length &&
                nextItem?.type === 'openai message' &&
                nextItem?.message.role === 'assistant'
            ) {
                // Only group if the agent response is cell_update or run_all_cells.
                // Other types (finished_task, ask_user_question) should be displayed normally
                // with their UI components, not grouped with the error message.
                const agentResponseType = nextItem.agentResponse?.type;
                if (agentResponseType === 'cell_update' || agentResponseType === 'run_all_cells') {
                    groupedErrorMessages.push(nextItem);
                    i = next_index;
                } else {
                    // Don't group - push the error message as a standalone item and let the next message
                    // be displayed normally with its UI component (finished_task, ask_user_question, etc.)
                    processedDisplayOptimizedChatHistory.push(groupedErrorMessages);
                    groupedErrorMessages = new Array<IDisplayOptimizedChatItem>();
                    // Continue to next iteration - don't skip the next item, let it be processed normally
                }
            } else {
                // No next message or next message is not an assistant message
                // Push the error message as a standalone item
                processedDisplayOptimizedChatHistory.push(groupedErrorMessages);
                groupedErrorMessages = new Array<IDisplayOptimizedChatItem>();
            }
        } else {
            if (groupedErrorMessages.length > 0) {
                processedDisplayOptimizedChatHistory.push(groupedErrorMessages);
                // Create a new array object since arrays are mutable and we want to avoid
                // accidentally modifying the array that was just pushed to the history
                groupedErrorMessages = new Array<IDisplayOptimizedChatItem>();
            }
            
            processedDisplayOptimizedChatHistory.push(displayOptimizedChatItem);
        }
    }

    // Handle case where the last messages were error messages
    if (groupedErrorMessages.length > 0) {
        processedDisplayOptimizedChatHistory.push(groupedErrorMessages);
    }

    return processedDisplayOptimizedChatHistory;
}; 