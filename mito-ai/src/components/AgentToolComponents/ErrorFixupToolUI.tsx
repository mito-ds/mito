import React, { useState } from 'react';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { classNames } from '../../utils/classNames';
import { getContentStringFromMessage, PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE, splitStringWithCodeBlocks } from '../../utils/strings';
// import OpenAI f`rom 'openai';
import '../../../style/ErrorFixupToolUI.css';
import ExpandIcon from '../../icons/ExpandIcon';
import WrenchAndScrewdriverIcon from '../../icons/WrenchAndScrewdriverIcon';
// import PythonCode from '../../Extensions/AiChat/ChatMessage/PythonCode';
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
    const [isExpanded, setIsExpanded] = useState(false);
    const messageContent = getContentStringFromMessage(messages[0]!.message);
    if (!messageContent) return null;

    return (
        <div className={classNames('error-fixup-container', {
            'error-fixup-collapsed': !isExpanded
        })}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
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
                    {messages.map((message, index) => {
                        const messageContentParts = splitStringWithCodeBlocks(message.message);
                        // const messageContent = getContentStringFromMessage(message.message);

                        return messageContentParts.map((messagePart, index) => {
                            if (messagePart.startsWith(PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE)) {
                                return (
                                    <PythonCode code={messagePart} renderMimeRegistry={renderMimeRegistry} />
                                )
                            }
                            return (
                                <div key={index}>{messagePart}</div>
                            )
                        })
                    })}
                </div>
            )}
        </div>
    );
};

export default ErrorFixupToolUI;
