/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { OpenAI } from 'openai';
import { GroupedErrorMessages } from '../../utils/chatHistory';
import { classNames } from '../../utils/classNames';
import { getContentStringFromMessage } from '../../utils/strings';
import PythonCode from '../../Extensions/AiChat/ChatMessage/PythonCode';
import AssistantCodeBlock from '../../Extensions/AiChat/ChatMessage/AssistantCodeBlock';
import AlertIcon from '../../icons/AlertIcon';
import AgentComponentHeader from './AgentComponentHeader';
import '../../../style/ErrorFixupToolUI.css';
import '../../../style/AgentComponentHeader.css';

interface IErrorFixupToolUIProps {
    messages: GroupedErrorMessages;
    renderMimeRegistry: IRenderMimeRegistry;
}

const parsePythonErrorType = (content: string | undefined): string => {
    if (!content) return 'Error';
    const errorMatch = content.match(/(\w+Error):/);
    return errorMatch?.[1] || 'Error';
};

const processErrorContent = (content: string | undefined): string => {
    if (!content) return '';
    
    // Remove all Python code (content between triple backticks).
    // If we don't do this, the PythonCode component will remove the error content,
    // and only show the code block. 
    return content.replace(/```(?:python)?[\s\S]*?```/g, '').trim();
};

const ErrorDetectedBlock = ({
    errorMessage,
    renderMimeRegistry,
}: {
    errorMessage: OpenAI.Chat.ChatCompletionMessageParam,
    renderMimeRegistry: IRenderMimeRegistry,
}): JSX.Element => {
    const [expandedError, setExpandedError] = useState(false);

    const rawErrorContent = getContentStringFromMessage(errorMessage);
    const errorContent = processErrorContent(rawErrorContent);
    const errorType = parsePythonErrorType(errorContent);

    const toggleError = (): void => {
        setExpandedError(!expandedError);
    };

    return (
        <div className={classNames('error-fixup-container', { expanded: expandedError })}>
            <AgentComponentHeader
                icon={<AlertIcon />}
                text={`${errorType} Detected`}
                onClick={toggleError}
                isExpanded={expandedError}
                displayBorder={false}
            />
            {expandedError && errorContent && (
                <div className="error-fixup-expanded">
                    <PythonCode
                        code={errorContent}
                        renderMimeRegistry={renderMimeRegistry}
                    />
                </div>
            )}
        </div>
    );
}

const GroupedErrorsAndFixes: React.FC<IErrorFixupToolUIProps> = ({
    messages,
    renderMimeRegistry,
}) => {
    return (
        <div className="error-fixup-root">
            <div className="error-fixup-header">
                <p>Fixing an error</p>
            </div>
            <div className="error-fixup-messages-container">
                {messages.map((messageItem, index) => {
                    const isUserMessage = messageItem.message.role === 'user';

                    if (isUserMessage) {
                        return (
                            <ErrorDetectedBlock
                                key={`error-${index}`}
                                errorMessage={messageItem.message}
                                renderMimeRegistry={renderMimeRegistry}
                            />
                        );
                    }
                    return (
                        <AssistantCodeBlock
                            key={`assistant-${index}`}
                            code={messageItem.message.content as string}
                            codeSummary={messageItem.agentResponse?.cell_update?.code_summary ?? undefined}
                            isCodeComplete={true}
                            renderMimeRegistry={renderMimeRegistry}
                            previewAICode={() => { }}
                            acceptAICode={() => { }}
                            rejectAICode={() => { }}
                            isLastAiMessage={false}
                            codeReviewStatus="chatPreview"
                            agentModeEnabled={true}
                            isErrorFixup={true}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default GroupedErrorsAndFixes;
