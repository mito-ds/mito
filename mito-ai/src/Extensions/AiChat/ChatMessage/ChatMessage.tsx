import React from 'react';
import OpenAI from 'openai';
import { classNames } from '../../../utils/classNames';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import CodeBlock from './CodeBlock';
import { INotebookTracker } from '@jupyterlab/notebook';
import { splitStringWithCodeBlocks } from '../../../utils/strings';
import ErrorIcon from '../../../icons/ErrorIcon';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { OperatingSystem } from '../../../utils/user';


interface IChatMessageProps {
    message: OpenAI.Chat.ChatCompletionMessageParam
    messageIndex: number
    error: boolean
    notebookTracker: INotebookTracker
    rendermime: IRenderMimeRegistry
    app: JupyterFrontEnd
    isLastAiMessage: boolean
    operatingSystem: OperatingSystem
    setDisplayCodeDiff: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatMessage: React.FC<IChatMessageProps> = ({
    message, 
    messageIndex, 
    error,
    notebookTracker,
    rendermime,
    app,
    isLastAiMessage,
    operatingSystem,
    setDisplayCodeDiff
}): JSX.Element | null => {
    if (message.role !== 'user' && message.role !== 'assistant') {
        // Filter out other types of messages, like system messages
        return null
    }

    const messageContentParts = splitStringWithCodeBlocks(message)

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
                            <CodeBlock 
                                code={messagePart}
                                role={message.role}
                                rendermime={rendermime}
                                notebookTracker={notebookTracker}
                                app={app}
                                isLastAiMessage={isLastAiMessage}
                                operatingSystem={operatingSystem}
                                setDisplayCodeDiff={setDisplayCodeDiff}
                            />
                        )
                    }
                } else {
                    return (
                        <p>{error && <span style={{marginRight: '4px'}}><ErrorIcon /></span>}{messagePart}</p>
                    )
                }
            })}
        </div>
    )
}

export default ChatMessage