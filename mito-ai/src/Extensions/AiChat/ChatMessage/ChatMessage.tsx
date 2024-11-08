import React, { useState } from 'react';
import OpenAI from 'openai';
import { classNames } from '../../../utils/classNames';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import CodeBlock from './CodeBlock';
import { INotebookTracker } from '@jupyterlab/notebook';
import { PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE, splitStringWithCodeBlocks } from '../../../utils/strings';
import ErrorIcon from '../../../icons/ErrorIcon';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { OperatingSystem } from '../../../utils/user';
import { UnifiedDiffLine } from '../../../utils/codeDiff';
import PencilIcon from '../../../icons/Pencil';
import ChatInput from './ChatInput';

interface IChatMessageProps {
    message: OpenAI.Chat.ChatCompletionMessageParam
    messageIndex: number
    mitoAIConnectionError: boolean
    notebookTracker: INotebookTracker
    rendermime: IRenderMimeRegistry
    app: JupyterFrontEnd
    isLastAiMessage: boolean
    operatingSystem: OperatingSystem
    setDisplayCodeDiff: React.Dispatch<React.SetStateAction<UnifiedDiffLine[] | undefined>>;
    acceptAICode: () => void
    rejectAICode: () => void
    onUpdateMessage: (messageIndex: number, newContent: string) => void
}

const ChatMessage: React.FC<IChatMessageProps> = ({
    message,
    messageIndex,
    mitoAIConnectionError,
    notebookTracker,
    rendermime,
    app,
    isLastAiMessage,
    operatingSystem,
    setDisplayCodeDiff,
    acceptAICode,
    rejectAICode,
    onUpdateMessage,
}): JSX.Element | null => {
    const [isEditing, setIsEditing] = useState(false);

    if (message.role !== 'user' && message.role !== 'assistant') {
        return null;
    }

    const messageContentParts = splitStringWithCodeBlocks(message);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSave = (content: string) => {
        onUpdateMessage(messageIndex, content);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className={classNames(
                "message",
                { "message-user": message.role === 'user' },
            )}>
                <ChatInput
                    initialContent={(message.content as string).replace(/```[\s\S]*?```/g, '').trim()}
                    placeholder={"Edit your message"}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isEditing={isEditing}
                />
            </div>
        );
    }

    return (
        <div className={classNames(
            "message",
            { "message-user": message.role === 'user' },
            { 'message-assistant': message.role === 'assistant' },
        )}>
            {messageContentParts.map((messagePart, index) => {
                if (messagePart.startsWith(PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE)) {
                    // Make sure that there is actually code in the message. 
                    // An empty code will look like this '```python  ```'
                    if (messagePart.length > 14) {
                        return (
                            <CodeBlock
                                key={index + messagePart} 
                                code={messagePart}
                                role={message.role}
                                rendermime={rendermime}
                                notebookTracker={notebookTracker}
                                app={app}
                                isLastAiMessage={isLastAiMessage}
                                operatingSystem={operatingSystem}
                                setDisplayCodeDiff={setDisplayCodeDiff}
                                acceptAICode={acceptAICode}
                                rejectAICode={rejectAICode}
                            />
                        )
                    }
                } else {
                    return (
                        <div style={{ position: 'relative' }}>
                            <p onDoubleClick={() => setIsEditing(true)}>
                                {mitoAIConnectionError && <span style={{ marginRight: '4px' }}><ErrorIcon /></span>}
                                {messagePart}
                            </p>
                            {message.role === 'user' && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                    <button
                                        className="message-edit-button"
                                        onClick={handleEditClick}
                                        style={{ cursor: 'pointer' }}
                                        title="Edit message"
                                    >
                                        <PencilIcon />
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                }
            })}
        </div>
    )
}

export default ChatMessage