import React, { useState } from 'react';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { classNames } from '../../utils/classNames';
import { getContentStringFromMessage, PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE, splitStringWithCodeBlocks } from '../../utils/strings';
import '../../../style/ErrorFixupToolUI.css';
import ExpandIcon from '../../icons/ExpandIcon';
import WrenchAndScrewdriverIcon from '../../icons/WrenchAndScrewdriverIcon';
import { GroupedErrorMessages } from '../../utils/chatHistory';
import PythonCode from '../../Extensions/AiChat/ChatMessage/PythonCode';
import AssistantCodeBlock from '../../Extensions/AiChat/ChatMessage/AssistantCodeBlock';

interface IErrorFixupToolUIProps {
    messages: GroupedErrorMessages;
    renderMimeRegistry: IRenderMimeRegistry;
}

const parsePythonErrorType = (content: string | undefined): string => {
    if (!content) return 'Error';
    const errorMatch = content.match(/(\w+Error):/);
    return errorMatch?.[1] || 'Error';
};

const ErrorFixupToolUI: React.FC<IErrorFixupToolUIProps> = ({ messages, renderMimeRegistry }) => {
    const [expandedError, setExpandedError] = useState(false);

    const toggleError = (): void => {
        setExpandedError(!expandedError);
    };

    if (!messages || messages.length === 0) return null;

    // Get the error content from the first message
    const errorContent = getContentStringFromMessage(messages[0]!.message);
    const errorType = parsePythonErrorType(errorContent);

    return (
        <div className="error-fixup-messages-container">
            {/* Hardcoded "Fixing an error" message */}
            <div className="error-fixup-header">
                Fixing an error
            </div>

            {/* Indented block for error and responses */}
            <div className="error-fixup-indented-block">
                {/* Error details in toggleable dropdown */}
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

                {/* Render responses using AssistantCodeBlock */}
                {messages.slice(1).map((message, messageIndex) => {
                    const messageContent = getContentStringFromMessage(message.message);
                    if (!messageContent) return null;

                    const messageContentParts = splitStringWithCodeBlocks(message.message);

                    return (
                        <div key={messageIndex + 1} className="error-fixup-response">
                            {messageContentParts.map((messagePart, partIndex) => {
                                if (messagePart.startsWith(PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE)) {
                                    return (
                                        <AssistantCodeBlock
                                            key={`${messageIndex + 1}-${partIndex}`}
                                            code={messagePart}
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
                                }
                                return (
                                    <div
                                        key={`${messageIndex + 1}-${partIndex}`}
                                        className="error-fixup-text-content"
                                    >
                                        {messagePart}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ErrorFixupToolUI;
