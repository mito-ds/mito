import React, { useState } from 'react';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { classNames } from '../../utils/classNames';
import { getContentStringFromMessage, PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE, splitStringWithCodeBlocks } from '../../utils/strings';
import '../../../style/ErrorFixupToolUI.css';
import ExpandIcon from '../../icons/ExpandIcon';
import WrenchAndScrewdriverIcon from '../../icons/WrenchAndScrewdriverIcon';
import { GroupedErrorMessages } from '../../utils/chatHistory';
import PythonCode from '../../Extensions/AiChat/ChatMessage/PythonCode';

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
    const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

    const toggleMessage = (index: number) => {
        const newExpanded = new Set(expandedMessages);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedMessages(newExpanded);
    };

    if (!messages || messages.length === 0) return null;

    return (
        <div className="error-fixup-messages-container">
            {messages.map((message, messageIndex) => {
                const messageContent = getContentStringFromMessage(message.message);
                if (!messageContent) return null;

                const isExpanded = expandedMessages.has(messageIndex);

                return (
                    <div
                        key={messageIndex}
                        className={classNames('error-fixup-container', {
                            'error-fixup-collapsed': !isExpanded
                        })}
                    >
                        <div
                            onClick={() => toggleMessage(messageIndex)}
                            className={classNames('error-fixup-toggle', {
                                expanded: isExpanded
                            })}
                        >
                            <span className="error-fixup-toggle-content">
                                <WrenchAndScrewdriverIcon />
                                Fixing {parsePythonErrorType(messageContent)}
                            </span>
                            <ExpandIcon isExpanded={isExpanded} />
                        </div>
                        {isExpanded && (
                            <div className="error-fixup-expanded">
                                {messageIndex === 0 ? (
                                    <PythonCode
                                        key={`${messageIndex}-0`}
                                        code={messageContent}
                                        renderMimeRegistry={renderMimeRegistry}
                                    />
                                ) : (() => {
                                    const messageContentParts = splitStringWithCodeBlocks(message.message);
                                    return messageContentParts.map((messagePart, partIndex) => {
                                        if (messagePart.startsWith(PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE)) {
                                            return (
                                                <PythonCode
                                                    key={`${messageIndex}-${partIndex}`}
                                                    code={messagePart}
                                                    renderMimeRegistry={renderMimeRegistry}
                                                />
                                            );
                                        }
                                        return (
                                            <div key={`${messageIndex}-${partIndex}`}>
                                                {messagePart}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ErrorFixupToolUI;
