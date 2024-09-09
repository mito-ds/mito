import OpenAI from "openai";

/* 
    Given a message from the OpenAI API, returns the content as a string. 
    If the content is not a string, returns undefined.
*/
const getContentStringFromMessage = (message: OpenAI.Chat.ChatCompletionMessageParam): string | undefined => {
    
    // TODO: We can't assume this is a string. We need to handle the other
    // return options
    if (message.role === 'user' ||  message.role === 'assistant') {
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
export const splitStringWithCodeBlocks = (message: OpenAI.Chat.ChatCompletionMessageParam) => {
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
export const getCodeBlockFromMessage = (message: OpenAI.Chat.ChatCompletionMessageParam) => {
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
*/
export const addMarkdownCodeFormatting = (code: string) => {
    
    const codeWithoutBackticks = code.split('```python')[1].split('```')[0].trim()
  
    // Note: We add a space after the code because for some unknown reason, the markdown 
    // renderer is cutting off the last character in the code block.
    return "```python\n" + codeWithoutBackticks + " " + "\n```"
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
export const removeMarkdownCodeFormatting = (code: string) => {
    return code.split('```python')[1].split('```')[0].trim()
}