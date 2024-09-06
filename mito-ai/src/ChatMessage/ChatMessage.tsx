import React from 'react';
import OpenAI from 'openai';
import { classNames } from '../utils/classNames';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import CodeMessagePart from './CodeMessagePart';
import { INotebookTracker } from '@jupyterlab/notebook';
import { splitStringWithCodeBlocks } from '../utils/strings';
import ErrorIcon from '../icons/ErrorIcon';


interface IChatMessageProps {
    message: OpenAI.Chat.ChatCompletionMessageParam
    messageIndex: number
    error: boolean
    notebookTracker: INotebookTracker
    rendermime: IRenderMimeRegistry
}

const ChatMessage: React.FC<IChatMessageProps> = ({
    message, 
    messageIndex, 
    error,
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
            {'message-assistant' : message.role === 'assistant'},
            {'message-error': error}
        )}>
            {messageContentParts.map(messagePart => {
                if (messagePart.startsWith('```python')) {
                    // Make sure that there is actually code in the message. 
                    // An empty code will look like this '```python  ```'
                    // TODO: Add a test for this since its broke a few times now.
                    if (messagePart.length > 14) {
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
                        <p>{error && <span style={{marginRight: '4px'}}margin-right><ErrorIcon /></span>}{messagePart}</p>
                    )
                }
            })}
        </div>
    )
}

export default ChatMessage