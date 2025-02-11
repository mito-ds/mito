import React, { useState } from 'react';
import OpenAI from 'openai';
import { classNames } from '../../../utils/classNames';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import CodeBlock from './CodeBlock';
import AlertBlock from './AlertBlock';
import MarkdownBlock from './MarkdownBlock';
import { INotebookTracker } from '@jupyterlab/notebook';
import { PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE, splitStringWithCodeBlocks } from '../../../utils/strings';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { OperatingSystem } from '../../../utils/user';
import PencilIcon from '../../../icons/Pencil';
import ChatInput from './ChatInput';
import { IVariableManager } from '../../VariableManager/VariableManagerPlugin';
import { CodeReviewStatus } from '../ChatTaskpane';
import { PromptType } from '../ChatHistoryManager';
import TextAndIconButton from '../../../components/TextAndIconButton';
import PlayButtonIcon from '../../../icons/PlayButtonIcon';
import CopyIcon from '../../../icons/CopyIcon';
import copyToClipboard from '../../../utils/copyToClipboard';
import TextButton from '../../../components/TextButton';
import { IDisplayOptimizedChatHistory } from '../ChatHistoryManager';

interface IChatMessageProps {
    message: OpenAI.Chat.ChatCompletionMessageParam
    messageType: IDisplayOptimizedChatHistory['type']
    codeCellID: string | undefined
    messageIndex: number
    promptType: PromptType
    mitoAIConnectionError: boolean
    mitoAIConnectionErrorType: string | null
    notebookTracker: INotebookTracker
    renderMimeRegistry: IRenderMimeRegistry
    app: JupyterFrontEnd
    isLastAiMessage: boolean
    operatingSystem: OperatingSystem
    previewAICode: () => void
    acceptAICode: () => void
    rejectAICode: () => void
    onUpdateMessage: (messageIndex: number, newContent: string, messageType: IDisplayOptimizedChatHistory['type']) => void
    variableManager?: IVariableManager
    codeReviewStatus: CodeReviewStatus
}

const ChatMessage: React.FC<IChatMessageProps> = ({
    message,
    messageType,
    messageIndex,
    promptType,
    mitoAIConnectionError,
    mitoAIConnectionErrorType,
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

    const editable = messageType === 'openai message:agent:planning' || message.role === 'user'

    const messageContentParts = splitStringWithCodeBlocks(message);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSave = (content: string) => {
        onUpdateMessage(messageIndex, content, messageType);
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

    if (mitoAIConnectionError) {
        return (
            <div className={classNames(
                "message",
            )}>
                <AlertBlock content={message.content as string} mitoAIConnectionErrorType={mitoAIConnectionErrorType} />
            </div>
        )
    }
    return (
        <div className={classNames(
            "message",
            { "message-user": message.role === 'user' },
            { 'message-assistant-chat': message.role === 'assistant' && messageType !== 'openai message:agent:planning' },
            { 'message-assistant-agent': messageType === 'openai message:agent:planning' },
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
                                    previewAICode={previewAICode}
                                    acceptAICode={acceptAICode}
                                    rejectAICode={rejectAICode}
                                    isLastAiMessage={isLastAiMessage}
                                    codeReviewStatus={codeReviewStatus}
                                />

                                {isLastAiMessage && codeReviewStatus === 'chatPreview' && 
                                    <div className='chat-message-buttons'>
                                        <TextAndIconButton 
                                            onClick={() => {previewAICode()}}
                                            text={'Overwrite Active Cell'}
                                            icon={PlayButtonIcon}
                                            title={'Write the Ai generated code to the active cell in the jupyter notebook, replacing the current code.'}
                                            variant='gray'
                                            width='fit-contents'
                                        />
                                        <TextAndIconButton 
                                            onClick={() => {copyToClipboard(messagePart)}}
                                            text={'Copy'}
                                            icon={CopyIcon}
                                            title={'Copy the Ai generated code to your clipboard'}
                                            variant='gray'
                                            width='fit-contents'
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
                                            width='fit-contents'
                                        />
                                        <TextButton 
                                            onClick={() => {rejectAICode()}}
                                            text={`Reject code ${operatingSystem === 'mac' ? '⌘U' : 'Ctrl+U'}`}
                                            title={'Reject the Ai generated code and revert to the previous version of the code cell'}
                                            variant='red'
                                            width='fit-contents'
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
                                {message.role === 'user' && promptType === 'smartDebug' ? (
                                    /* Use a pre tag to preserve the newline and indentation of the error message */
                                    <pre className="chat-taskpane-smart-debug-error-message">
                                        {messagePart}
                                    </pre>
                                ) : (
                                    <MarkdownBlock
                                        markdown={messagePart}
                                        renderMimeRegistry={renderMimeRegistry}
                                    />
                                )}
                            </p>
                            {editable && (
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