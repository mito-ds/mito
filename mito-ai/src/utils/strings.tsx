/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import OpenAI from "openai";

export const PYTHON_CODE_BLOCK_START_WITH_NEW_LINE = '```python\n'
export const PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE = '```python'
export const PYTHON_CODE_BLOCK_END_WITH_NEW_LINE = '\n```'
export const PYTHON_CODE_BLOCK_END_WITHOUT_NEW_LINE = '```'


/* 
    Given a message from the OpenAI API, returns the content as a string. 
    If the content is not a string, returns undefined.
*/
export const getContentStringFromMessage = (message: OpenAI.Chat.ChatCompletionMessageParam): string | undefined => {
    
    // TODO: We can't assume this is a string. We need to handle the other
    // return options
    if (message.role === 'user' ||  message.role === 'assistant') {

        // Don't convert the message to a string if the content is undefined or null
        // so we can continue to use type checking
        if (message.content === undefined || message.content === null) {
            return undefined
        }

        return message.content as string
    }

    return undefined
}


/* 
    Given a string like "Hello ```python print('Hello, world!')```",
    returns ["Hello", "```python print('Hello, world!')```"]

    This is useful for taking an AI generated message and displaying the code in 
    code blocks and the rest of the message in plain text.
*/
export const splitStringWithCodeBlocks = (message: OpenAI.Chat.ChatCompletionMessageParam): string[] => {
    const messageContent = getContentStringFromMessage(message)

    if (!messageContent) {
        return []
    }

    const parts = messageContent.split(/(```[\s\S]*?```)/);
    
    // Remove empty strings caused by consecutive delimiters, if any
    return parts.filter(part => part.trim() !== "");
}

/* 
    Given a string like "Hello ```python print('Hello, world!')```",
    returns "```python print('Hello, world!')```"
*/
export const getCodeBlockFromMessage = (message: OpenAI.Chat.ChatCompletionMessageParam): string | undefined => {
    const parts = splitStringWithCodeBlocks(message)
    return parts.find(part => part.startsWith('```'))
}


/* 
    To display code in markdown, we need to take input values like this:

    ```python x + 1```

    And turn them into this:

    ```python
    x + 1
    ```

    Sometimes, we also want to trim the code to remove any leading or trailing whitespace. For example, 
    when we're displaying the code in the chat history this is useful. Othertimes we don't want to trim.
    For example, when we're displaying the code in the active cell, we want to keep the users's whitespace.
    This is important for showing diffs. If the code cell contains no code, the first line will be marked as 
    removed in the code diff. To ensure the diff lines up with the code, we need to leave this whitespace line.
*/
export const addMarkdownCodeFormatting = (code: string | undefined, trim?: boolean): string | undefined => {

    if (code === undefined) {
        return undefined
    }
    
    let codeWithoutBackticks = code
    
    // If the code already has the code formatting backticks, remove them 
    // so we can add them back in the correct format
    if (code.split(PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE).length > 1) {
        const parts = code.split(PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE);
        if (parts.length > 1 && parts[1] != null) {
            const endParts = parts[1].split(PYTHON_CODE_BLOCK_END_WITHOUT_NEW_LINE);
            codeWithoutBackticks = endParts[0] ?? '';
        }
    } else {
        codeWithoutBackticks = code
    }

    if (trim) {
        codeWithoutBackticks = codeWithoutBackticks.trim()
    }
  
    // Note: We add a space after the code because for some unknown reason, the markdown 
    // renderer is cutting off the last character in the code block.
    return `${PYTHON_CODE_BLOCK_START_WITH_NEW_LINE}${codeWithoutBackticks} ${PYTHON_CODE_BLOCK_END_WITH_NEW_LINE}`
}

/* 
    To write code in a Jupyter Code Cell, we need to take inputs like this: 

    ```python
    x + 1
    ```

    And turn them into this:

    x + 1

    Jupyter does not need the backticks. 
*/
export const removeMarkdownCodeFormatting = (code: string): string => {
    
    if (code.split(PYTHON_CODE_BLOCK_START_WITH_NEW_LINE).length > 1) {
        const parts = code.split(PYTHON_CODE_BLOCK_START_WITH_NEW_LINE)[1]!.split(PYTHON_CODE_BLOCK_END_WITH_NEW_LINE)[0]!;
        return parts;
    }

    return code;
}


/* 
    Remove ANSI escape sequences from text. 
    For example, this is useful for removing the escape 
    codes from the error traceback.
*/
export const stripAnsiCodes = (text: string): string => {
    // eslint-disable-next-line no-control-regex
    const ansiEscape = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
    return text.replace(ansiEscape, '');
}