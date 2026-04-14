/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { OpenAI } from "openai";

export const FREE_TIER_LIMIT_REACHED_ERROR_TITLE = 'mito_server_free_tier_limit_reached'

export const isErrorFixupMessage = (
    message: OpenAI.Chat.ChatCompletionMessageParam,
    messageContent: string | undefined
): boolean => {

    if (!messageContent) {
        return false;
    }

    if (message.role !== 'user') {
        return false;
    }

    // Detect error-like user text heuristically.
    // We intentionally allow plain "<Type>Error: ..." messages, because many
    // backend/tool errors are persisted without trace pointers ("->" or "^").
    const looksLikeError = /(?:\b\w+)?Error:/.test(messageContent);
    const hasTracePointer = messageContent.includes('->') || messageContent.includes('^');

    return looksLikeError || hasTracePointer;
}