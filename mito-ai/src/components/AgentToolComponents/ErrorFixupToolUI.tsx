import React, { useState } from 'react';
// import { classNames } from '../../utils/classNames';
import { getContentStringFromMessage } from '../../utils/strings';
import OpenAI from 'openai';
import '../../../style/ErrorFixupToolUI.css';
import ExpandIcon from '../../icons/ExpandIcon';
import WrenchAndScrewdriverIcon from '../../icons/WrenchAndScrewdriverIcon';

interface IErrorFixupToolUIProps {
    message: OpenAI.Chat.ChatCompletionMessageParam;
}

const parsePythonErrorType = (content: string | undefined): string => {
    if (!content) return 'Error';
    const errorMatch = content.match(/(\w+Error):/);
    return errorMatch?.[1] || 'Error';
};

const ErrorFixupToolUI: React.FC<IErrorFixupToolUIProps> = ({ message }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const messageContent = getContentStringFromMessage(message);

    return (
        <div
            className="error-fixup-container"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="error-fixup-content">
                <WrenchAndScrewdriverIcon />
                <span>Fixing {parsePythonErrorType(messageContent)}</span>
                <ExpandIcon isExpanded={isExpanded} />
            </div>

            {isExpanded && (
                <div>
                    {messageContent}
                </div>
            )}
        </div>
    );
};

export default ErrorFixupToolUI;
