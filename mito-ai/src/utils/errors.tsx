/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { OpenAI } from "openai";
import { PromptType } from "../Extensions/AiChat/ChatHistoryManager";

export const FREE_TIER_LIMIT_REACHED_ERROR_TITLE = 'mito_server_free_tier_limit_reached'

export const isErrorFixupMessage = (
    promptType: PromptType,
    message: OpenAI.Chat.ChatCompletionMessageParam,
    messageContent: string | undefined
): boolean => {

    if (!messageContent) {
        return false;
    }

    return (
        // Detect error-like user text heuristically.
        (message.role === 'user' && 
            messageContent && 
            messageContent.includes('->') || messageContent?.includes('^') && 
            /\w+Error:/.test(messageContent)
        )
    )
}