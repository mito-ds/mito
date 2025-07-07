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
        const displayOptimizedChatItem = displayOptimizedChatHistory[i];
        if (!displayOptimizedChatItem) {
            continue;
        }

        const messageContent = getContentStringFromMessage(displayOptimizedChatItem.message);
        const _isErrorFixupMessage = isErrorFixupMessage(
            displayOptimizedChatItem.promptType, 
            displayOptimizedChatItem.message, 
            messageContent
        );

        if (_isErrorFixupMessage) {
            // If the current message is an error fixup message, we need to group it with the next message
            // which is the ai response to the error fixup message.
            groupedErrorMessages.push(displayOptimizedChatItem);
            
            // Note: We check that the next message is an ai response to the error fixup message.
            // If the user has stopped the agent, it might not be an ai response to the error fixup message.

            const next_index = i + 1;
            if (
                next_index < displayOptimizedChatHistory.length &&
                displayOptimizedChatHistory[next_index]?.type === 'openai message' &&
                displayOptimizedChatHistory[next_index]?.message.role === 'assistant'
            ) {
                groupedErrorMessages.push(displayOptimizedChatHistory[next_index]!);
                i = next_index;
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