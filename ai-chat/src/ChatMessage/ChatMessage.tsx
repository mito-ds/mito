import React from 'react';
import OpenAI from 'openai';
import { classNames } from '../utils/classNames';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import CodeMessagePart from './CodeMessagePart';
import { INotebookTracker } from '@jupyterlab/notebook';

const splitStringWithCodeBlocks = (str: string) => {
    // This regex matches code blocks and non-code block text
    const regex = /(```python[\s\S]*?```)|([^`]+)/g;
    
    // Use match to find all occurrences
    const matches = str.match(regex);

    if (!matches) {
        return [str]
    }
    
    // Trim whitespace from non-code block parts
    return matches.map(part => part.startsWith('```') ? part : part.trim()).filter(Boolean);
  }

interface IChatMessageProps {
    message: OpenAI.Chat.ChatCompletionMessageParam
    messageIndex: number
    notebookTracker: INotebookTracker
    rendermime: IRenderMimeRegistry
}

const ChatMessage: React.FC<IChatMessageProps> = ({
    message, 
    messageIndex, 
    notebookTracker,
    rendermime
}): JSX.Element | null => {
    if (message.role !== 'user' && message.role !== 'assistant') {
        // Filter out other types of messages, like system messages
        return null
    }

    // TODO: We can't assume this is a string. We need to handle the other
    // return options
    const messageContentParts = splitStringWithCodeBlocks(message.content as string)

    return (
        <div className={classNames(
            "message", 
            {"message-user" : message.role === 'user'},
            {'message-assistant' : message.role === 'assistant'}
        )}
        >
            {messageContentParts.map(messagePart => {
                if (messagePart.startsWith('```python')) {
                    // Make sure that there is actually code in the message. 
                    // An empty code will look like this '```python```'
                    if (messagePart.length > 12) {
                        return (
                            <CodeMessagePart 
                                code={messagePart}
                                role={message.role}
                                rendermime={rendermime}
                                notebookTracker={notebookTracker}
                            />
                        )
                    }
                } else {
                    return (
                        <p>{messagePart}</p>
                    )
                }
            })}
        </div>
    )
}

export default ChatMessage