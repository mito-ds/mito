import React, { useState } from 'react';
import OpenAI from 'openai';
import { classNames } from '../../../utils/classNames';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import CodeBlock from './CodeBlock';
import MarkdownBlock from './MarkdownBlock';
import { INotebookTracker } from '@jupyterlab/notebook';
import { PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE, splitStringWithCodeBlocks } from '../../../utils/strings';
import ErrorIcon from '../../../icons/ErrorIcon';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { OperatingSystem } from '../../../utils/user';
import { UnifiedDiffLine } from '../../../utils/codeDiff';
import PencilIcon from '../../../icons/Pencil';
import ChatInput from './ChatInput';
import { IVariableManager } from '../../VariableManager/VariableManagerPlugin';
import { CodeReviewStatus } from '../ChatTaskpane';

interface IChatMessageProps {
    message: OpenAI.Chat.ChatCompletionMessageParam
    codeCellID: string | undefined
    messageIndex: number
    mitoAIConnectionError: boolean
    notebookTracker: INotebookTracker
    renderMimeRegistry: IRenderMimeRegistry
    app: JupyterFrontEnd
    isLastAiMessage: boolean
    operatingSystem: OperatingSystem
    setDisplayCodeDiff: React.Dispatch<React.SetStateAction<UnifiedDiffLine[] | undefined>>;
    previewAICode: () => void
    acceptAICode: () => void
    rejectAICode: () => void
    onUpdateMessage: (messageIndex: number, newContent: string) => void
    variableManager?: IVariableManager
    codeReviewStatus: CodeReviewStatus
}

const ChatMessage: React.FC<IChatMessageProps> = ({
    message,
    codeCellID,
    messageIndex,
    mitoAIConnectionError,
    notebookTracker,
    renderMimeRegistry,
    app,
    isLastAiMessage,
    operatingSystem,
    setDisplayCodeDiff,
    previewAICode,
    acceptAICode,
    rejectAICode,
    onUpdateMessage,
    variableManager,
    codeReviewStatus
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
                    variableManager={variableManager}
                    notebookTracker={notebookTracker}
                    renderMimeRegistry={renderMimeRegistry}
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
                                codeCellID={codeCellID}
                                role={message.role}
                                renderMimeRegistry={renderMimeRegistry}
                                notebookTracker={notebookTracker}
                                app={app}
                                isLastAiMessage={isLastAiMessage}
                                operatingSystem={operatingSystem}
                                setDisplayCodeDiff={setDisplayCodeDiff}
                                previewAICode={previewAICode}
                                acceptAICode={acceptAICode}
                                rejectAICode={rejectAICode}
                                codeReviewStatus={codeReviewStatus}
                            />
                        )
                    }
                } else {
                    return (
                        <div className={classNames('markdown-message-part')} style={{ position: 'relative' }}>
                            <p 
                                key={index + messagePart} 
                                onDoubleClick={() => {
                                    // Only allow users to edit their own messages, not the AI responses
                                    if (message.role === 'user') {
                                        setIsEditing(true)
                                    }
                                }}
                            >
                                {mitoAIConnectionError && <span style={{ marginRight: '4px' }}><ErrorIcon /></span>}
                                <MarkdownBlock
                                    markdown={messagePart}
                                    renderMimeRegistry={renderMimeRegistry}
                                />
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