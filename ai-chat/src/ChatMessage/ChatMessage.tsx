import React from 'react';
import OpenAI from 'openai';
import { classNames } from '../utils/classNames';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import CodeMessagePart from './CodeMessagePart';
import { INotebookTracker } from '@jupyterlab/notebook';

interface IChatMessageProps {
    message: OpenAI.Chat.ChatCompletionMessageParam
    messageIndex: number
    notebookTracker: INotebookTracker
    languageRegistry: IEditorLanguageRegistry
}

const ChatMessage: React.FC<IChatMessageProps> = ({
    message, 
    messageIndex, 
    notebookTracker,
    languageRegistry
}): JSX.Element | null => {
    console.log(messageIndex)
    if (message.role !== 'user' && message.role !== 'assistant') {
        // Filter out other types of messages, like system messages
        return null
    }

    // TODO: We can't assume this is a string. We need to handle the other
    // return options
    const messageContentParts = (message.content as string).split('```')


    return (
        <div className={classNames(
            "message", 
            {"message-user" : message.role === 'user'},
            {'message-assistant' : message.role === 'assistant'}
        )}
        >
            {messageContentParts.map(messagePart => {
                if (messagePart.startsWith('python')) {
                    return (
                        <CodeMessagePart 
                            code={messagePart.split('python')[1].trim()}
                            role={message.role}
                            languageRegistry={languageRegistry}
                            notebookTracker={notebookTracker}
                        />
                    )
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