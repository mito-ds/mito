import React from 'react';
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
import { useState } from 'react';

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
    onUpdateMessage
}): JSX.Element | null => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(
        // When editing, remove the code block from message.
        // ChatHistoryManager will re-add the code block.
        (message.content as string).replace(/```[\s\S]*?```/g, '').trim()
    );

    if (message.role !== 'user' && message.role !== 'assistant') {
        // Filter out other types of messages, like system messages
        return null
    }

    const messageContentParts = splitStringWithCodeBlocks(message)

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        onUpdateMessage(messageIndex, editedContent);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedContent(message.content as string);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className={classNames(
                "message",
                { "message-user": message.role === 'user' },
                { 'message-assistant': message.role === 'assistant' },
            )}>
                <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    onKeyDown={(e) => {
                        // Enter key sends the message, but we still want to allow 
                        // shift + enter to add a new line.
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSave()
                        }
                    }}
                    className="message-edit-textarea"
                    autoFocus
                />
                <div className="message-edit-buttons">
                    <button onClick={handleSave}>Save</button>
                    <button onClick={handleCancel}>Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className={classNames(
            "message",
            { "message-user": message.role === 'user' },
            { 'message-assistant': message.role === 'assistant' },
        )}>
            {messageContentParts.map(messagePart => {
                if (messagePart.startsWith(PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE)) {
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
                                acceptAICode={acceptAICode}
                                rejectAICode={rejectAICode}
                            />
                        )
                    }
                } else {
                    return (
                        <p onDoubleClick={() => setIsEditing(true)}>
                            {mitoAIConnectionError && <span style={{ marginRight: '4px' }}><ErrorIcon /></span>}
                            {messagePart}
                            {message.role === 'user' && (
                                <span
                                    style={{ position: 'relative', top: '2px', marginLeft: '4px', cursor: 'pointer' }}
                                    onClick={handleEditClick}
                                >
                                    <PencilIcon />
                                </span>
                            )}
                        </p>
                    )
                }
            })}
        </div>
    )
}

export default ChatMessage