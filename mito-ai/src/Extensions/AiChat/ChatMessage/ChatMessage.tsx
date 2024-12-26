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
import TextAndIconButton from '../../../components/TextAndIconButton';
import PlayButtonIcon from '../../../icons/PlayButtonIcon';
import CopyIcon from '../../../icons/CopyIcon';
import copyToClipboard from '../../../utils/copyToClipboard';
import TextButton from '../../../components/TextButton';

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
    messageIndex,
    mitoAIConnectionError,
    notebookTracker,
    renderMimeRegistry,
    isLastAiMessage,
    operatingSystem,
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
                            <>
                                <CodeBlock
                                    key={index + messagePart}
                                    code={messagePart}
                                    role={message.role}
                                    renderMimeRegistry={renderMimeRegistry}
                                />

                                {isLastAiMessage && codeReviewStatus === 'chatPreview' && 
                                    <div className='chat-message-buttons'>
                                        <TextAndIconButton 
                                            onClick={() => {previewAICode()}}
                                            text={'Overwrite Active Cell'}
                                            icon={PlayButtonIcon}
                                            title={'Write the Ai generated code to the active cell in the jupyter notebook, replacing the current code.'}
                                            variant='green'
                                        />
                                        <TextAndIconButton 
                                            onClick={() => {copyToClipboard(messagePart)}}
                                            text={'Copy'}
                                            icon={CopyIcon}
                                            title={'Copy the Ai generated code to your clipboard'}
                                            variant='green'
                                        />
                                    </div>
                                }
                                {isLastAiMessage && codeReviewStatus === 'codeCellPreview' && 
                                    <div className='chat-message-buttons'>
                                        <TextButton 
                                            onClick={() => {acceptAICode()}}
                                            text={`Accept code ${operatingSystem === 'mac' ? '⌘Y' : 'Ctrl+Y'}`}
                                            title={'Accept the Ai generated code'}
                                            variant='green'
                                        />
                                        <TextButton 
                                            onClick={() => {rejectAICode()}}
                                            text={`Reject code ${operatingSystem === 'mac' ? '⌘D' : 'Ctrl+D'}`}
                                            title={'Reject the Ai generated code and revert to the previous version of the code cell'}
                                            variant='red'
                                        />
                                    </div>

                                }
                            </>
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