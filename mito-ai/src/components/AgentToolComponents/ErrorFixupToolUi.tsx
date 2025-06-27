import React, { useState } from 'react';
import { classNames } from '../../utils/classNames';
import { getContentStringFromMessage } from '../../utils/strings';
import OpenAI from 'openai';
import ErrorIcon from '../../icons/ErrorIcon';
import '../../../style/ErrorFixupToolUI.css';
import ExpandIcon from '../../icons/ExpandIcon';

interface IErrorFixupToolUiProps {
    message: OpenAI.Chat.ChatCompletionMessageParam;
}

const parsePythonErrorType = (content: string | undefined): string => {
    if (!content) return 'Error';
    const errorMatch = content.match(/(\w+Error):/);
    return errorMatch?.[1] || 'Error';
};

const ErrorFixupToolUi: React.FC<IErrorFixupToolUiProps> = ({ message }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const messageContent = getContentStringFromMessage(message);

    return (
        <div
            className="error-fixup-container"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="error-fixup-content">
                <ErrorIcon />
                <span>Fixing {parsePythonErrorType(messageContent)}</span>
                <ExpandIcon isExpanded={isExpanded} />
            </div>

            {isExpanded && (
                <div className={classNames("error-fixup-container", "error-fixup-expanded")}>
                    {messageContent}
                </div>
            )}
        </div>
    );
};

export default ErrorFixupToolUi;
