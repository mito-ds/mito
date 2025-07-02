import React, { useState } from 'react';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { GroupedErrorMessages } from '../../utils/chatHistory';
import { classNames } from '../../utils/classNames';
import { getContentStringFromMessage } from '../../utils/strings';
import WrenchAndScrewdriverIcon from '../../icons/WrenchAndScrewdriverIcon';
import ExpandIcon from '../../icons/ExpandIcon';
import PythonCode from '../../Extensions/AiChat/ChatMessage/PythonCode';
import AssistantCodeBlock from '../../Extensions/AiChat/ChatMessage/AssistantCodeBlock';
import '../../../style/ErrorFixupToolUI.css';

interface IErrorFixupToolUIProps {
    messages: GroupedErrorMessages;
    renderMimeRegistry: IRenderMimeRegistry;
}

const parsePythonErrorType = (content: string | undefined): string => {
    if (!content) return 'Error';
    const errorMatch = content.match(/(\w+Error):/);
    return errorMatch?.[1] || 'Error';
};

const ErrorBlock = ({ errorMessage, renderMimeRegistry }: { errorMessage: any, renderMimeRegistry: IRenderMimeRegistry }) => {
    const [expandedError, setExpandedError] = useState(false);

    const errorContent = getContentStringFromMessage(errorMessage);
    const errorType = parsePythonErrorType(errorContent);

    const toggleError = (): void => {
        setExpandedError(!expandedError);
    };

    return (
        <div
        className={classNames('error-fixup-container', {
            'error-fixup-collapsed': !expandedError
        })}
    >
        <div
            onClick={toggleError}
            className={classNames('error-fixup-toggle', {
                expanded: expandedError
            })}
        >
            <span className="error-fixup-toggle-content">
                <WrenchAndScrewdriverIcon />
                Error {errorType}
            </span>
            <ExpandIcon isExpanded={expandedError} />
        </div>
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

const ErrorFixupToolUI: React.FC<IErrorFixupToolUIProps> = ({ messages, renderMimeRegistry }) => {
    return (
        <div>
            {messages.map((messageItem, index) => {
                const isUserMessage = messageItem.message.role === 'user';
                
                if (isUserMessage) {
                    return (
                        <ErrorBlock errorMessage={messageItem.message} renderMimeRegistry={renderMimeRegistry} />
                    );
                } 
                return (
                    <AssistantCodeBlock
                        key={`${index}`}
                        code={messageItem.message.content as string}
                        isCodeComplete={true}
                        renderMimeRegistry={renderMimeRegistry}
                        previewAICode={() => { }}
                        acceptAICode={() => { }}
                        rejectAICode={() => { }}
                        isLastAiMessage={false}
                        codeReviewStatus="chatPreview"
                        agentModeEnabled={true}
                    />
                );
            })}
        </div>
    );
};

export default ErrorFixupToolUI;
