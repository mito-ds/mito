/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import OpenAI from 'openai';
import { classNames } from '../../../utils/classNames';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import UserCodeBlock from './UserCodeBlock';
import AssistantCodeBlock from './AssistantCodeBlock';
import AlertBlock from './AlertBlock';
import MarkdownBlock from './MarkdownBlock';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getContentStringFromMessage, PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE, splitStringWithCodeBlocks } from '../../../utils/strings';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { OperatingSystem } from '../../../utils/user';
import PencilIcon from '../../../icons/Pencil';
import ChatInput from './ChatInput';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';
import { CodeReviewStatus } from '../ChatTaskpane';
import { PromptType } from '../ChatHistoryManager';
import TextAndIconButton from '../../../components/TextAndIconButton';
import PlayButtonIcon from '../../../icons/PlayButtonIcon';
import CopyIcon from '../../../icons/CopyIcon';
import copyToClipboard from '../../../utils/copyToClipboard';
import TextButton from '../../../components/TextButton';
import '../../../../style/ChatMessage.css';
import '../../../../style/MarkdownMessage.css'
import { AgentResponse } from '../../../websockets/completions/CompletionModels';
import GetCellOutputToolUI from '../../../components/AgentComponents/GetCellOutputToolUI';
import AssumptionToolUI from '../../../components/AgentComponents/AssumptionToolUI';
import SelectedContextContainer from '../../../components/SelectedContextContainer';

interface IChatMessageProps {
    app: JupyterFrontEnd;
    message: OpenAI.Chat.ChatCompletionMessageParam
    codeCellID: string | undefined
    agentResponse: AgentResponse | undefined
    messageIndex: number
    promptType: PromptType
    mitoAIConnectionError: boolean
    mitoAIConnectionErrorType: string | null
    notebookTracker: INotebookTracker
    renderMimeRegistry: IRenderMimeRegistry
    isLastAiMessage: boolean
    isLastMessage: boolean
    operatingSystem: OperatingSystem
    previewAICode: () => void
    acceptAICode: () => void
    rejectAICode: () => void
    onUpdateMessage: (messageIndex: number, newContent: string, additionalContext?: Array<{ type: string, value: string }>) => void
    contextManager?: IContextManager
    codeReviewStatus: CodeReviewStatus
    setNextSteps: (nextSteps: string[]) => void
    agentModeEnabled: boolean
    additionalContext?: Array<{ type: string, value: string }>
}

const ChatMessage: React.FC<IChatMessageProps> = ({
    app,
    message,
    promptType,
    agentResponse,
    messageIndex,
    mitoAIConnectionError,
    mitoAIConnectionErrorType,
    notebookTracker,
    renderMimeRegistry,
    isLastAiMessage,
    isLastMessage,
    operatingSystem,
    previewAICode,
    acceptAICode,
    rejectAICode,
    onUpdateMessage,
    contextManager,
    codeReviewStatus,
    setNextSteps,
    agentModeEnabled,
    additionalContext,
}): JSX.Element | null => {
    const [isEditing, setIsEditing] = useState(false);

    if (message.role !== 'user' && message.role !== 'assistant') {
        return null;
    }

    const editable = message.role === 'user'

    const messageContentParts = splitStringWithCodeBlocks(message);
    const messageContent = getContentStringFromMessage(message);

    const handleEditClick = (): void => {
        setIsEditing(true);
    };

    const handleSave = (
        content: string,
        _index?: number,
        additionalContext?: Array<{ type: string, value: string }>
    ): void => {
        onUpdateMessage(messageIndex, content, additionalContext);
        setIsEditing(false);
    };

    const handleCancel = (): void => {
        setIsEditing(false);
    };

    if (
        isLastMessage && agentResponse?.type === 'finished_task' &&
        agentResponse.next_steps &&
        agentResponse.next_steps.length > 0
    ) {
        /* 
        We only want to set the next steps if the message is the last message in the chat.
        This is because the next steps are only available after the agent has finished its task.

        We handle this in the ChatMessage component to automatically handle reloading a previous chat thread.
        */
        setNextSteps(agentResponse.next_steps);
    }

    if (isEditing) {
        return (
            <ChatInput
                app={app}
                initialContent={(message.content as string).replace(/```[\s\S]*?```/g, '').trim()}
                placeholder={"Edit your message"}
                onSave={handleSave}
                onCancel={handleCancel}
                isEditing={isEditing}
                contextManager={contextManager}
                notebookTracker={notebookTracker}
                agentModeEnabled={false}
            />
        );
    }

    if (mitoAIConnectionError) {
        return (
            <div className={classNames(
                "message",
            )}>
                <AlertBlock
                    content={message.content as string}
                    mitoAIConnectionErrorType={mitoAIConnectionErrorType}
                />
            </div>
        )
    }

    // If the message is empty, don't render anything
    if (messageContent === undefined || messageContent === '') {
        return <></>
    }

    // While the code is streaming back we don't want to show the overwrite button. 
    // Users end up applying the code in the middle of streaming and it gets very confusing
    // very quickly for users. 
    let isCodeComplete = false;

    return (
        <div className={classNames(
            "message",
            { "message-user": message.role === 'user' },
            { 'message-assistant-chat': message.role === 'assistant' },
        )}>
            {messageContentParts.map((messagePart, index) => {
                if (messagePart.startsWith(PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE)) {

                    isCodeComplete = messagePart.endsWith('```');

                    // Make sure that there is actually code in the message. 
                    // An empty code will look like this '```python  ```'
                    if (messagePart.length > 14) {
                        return (
                            <>
                                {message.role === 'user' ? (
                                    <UserCodeBlock
                                        code={messagePart}
                                        renderMimeRegistry={renderMimeRegistry}
                                        agentModeEnabled={agentModeEnabled}
                                    />
                                ) : (
                                    <AssistantCodeBlock
                                        code={messagePart}
                                        codeSummary={agentResponse?.cell_update?.code_summary ?? undefined}
                                        isCodeComplete={isCodeComplete}
                                        renderMimeRegistry={renderMimeRegistry}
                                        previewAICode={previewAICode}
                                        acceptAICode={acceptAICode}
                                        rejectAICode={rejectAICode}
                                        isLastAiMessage={isLastAiMessage}
                                        codeReviewStatus={codeReviewStatus}
                                        agentModeEnabled={agentModeEnabled}
                                    />
                                )}

                                {isLastAiMessage && isCodeComplete && codeReviewStatus === 'chatPreview' &&
                                    <div className='chat-message-buttons'>
                                        <TextAndIconButton
                                            onClick={() => { previewAICode() }}
                                            text={'Overwrite Active Cell'}
                                            icon={PlayButtonIcon}
                                            title={'Write the Ai generated code to the active cell in the jupyter notebook, replacing the current code.'}
                                            variant='gray'
                                            width='fit-contents'
                                        />
                                        <TextAndIconButton
                                            onClick={() => { void copyToClipboard(messagePart) }}
                                            text={'Copy'}
                                            icon={CopyIcon}
                                            title={'Copy the Ai generated code to your clipboard'}
                                            variant='gray'
                                            width='fit-contents'
                                        />
                                    </div>
                                }
                                {isLastAiMessage && isCodeComplete && codeReviewStatus === 'codeCellPreview' &&
                                    <div className='chat-message-buttons'>
                                        <TextButton
                                            onClick={() => { acceptAICode() }}
                                            text={`Accept code ${operatingSystem === 'mac' ? '⌘Y' : 'Ctrl+Y'}`}
                                            title={'Accept the Ai generated code'}
                                            variant='green'
                                            width='fit-contents'
                                        />
                                        <TextButton
                                            onClick={() => { rejectAICode() }}
                                            text={`Reject code ${operatingSystem === 'mac' ? '⌘U' : 'Ctrl+U'}`}
                                            title={'Reject the Ai generated code and revert to the previous version of the code cell'}
                                            variant='red'
                                            width='fit-contents'
                                        />
                                    </div>

                                }
                                {message.role === 'user' && additionalContext && additionalContext.length > 0 &&
                                    <>
                                        {additionalContext
                                            .filter(context => context.type !== 'active_cell') // Hide active cell context in chat messages
                                            .map((context, index) => (
                                                <SelectedContextContainer
                                                    key={`${context.type}-${context.value}-${index}`}
                                                    title={`${context.value}`}
                                                    type={context.type}
                                                    onRemove={() => { }} // Read-only in chat history
                                                />
                                            ))}
                                    </>
                                }
                            </>
                        )
                    } else {
                        // Return null for empty code blocks
                        return null;
                    }
                } else {
                    return (
                        <div key={index + messagePart} className={classNames('markdown-message-part')}>
                            <p
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
                                        notebookTracker={notebookTracker}
                                    />
                                )}
                            </p>
                            {agentResponse?.analysis_assumptions &&
                                <AssumptionToolUI assumptions={agentResponse.analysis_assumptions} />
                            }
                        </div>
                    )
                }
            })}
            {editable &&
                <div className="message-action-buttons">
                    <button
                        className="message-start-editing-button"
                        onClick={handleEditClick}
                        title="Edit message"
                    >
                        <PencilIcon />
                    </button>
                </div>
            }
            {agentResponse?.type === 'get_cell_output' &&
                <GetCellOutputToolUI />
            }
        </div>
    )
}

export default ChatMessage