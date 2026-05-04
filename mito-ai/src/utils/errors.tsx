/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { OpenAI } from 'openai';

export const FREE_TIER_LIMIT_REACHED_ERROR_TITLE =
  'mito_server_free_tier_limit_reached';

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

    // Detect traceback-like user text: an exception line plus a pointer line
    // ("->" e.g. from IPython "---->", or "^" from caret markers).
    const looksLikeError = /(?:\b\w+)?Error:/.test(messageContent);
    const hasTracePointer = messageContent.includes('->') || messageContent.includes('^');

    return looksLikeError && hasTracePointer;
}
