import React, { useState } from 'react';
import { classNames } from '../../utils/classNames';
import { getContentStringFromMessage } from '../../utils/strings';
import OpenAI from 'openai';
import ErrorIcon from '../../icons/ErrorIcon';
import '../../../style/ErrorFixupToolUI.css';

interface IErrorFixupToolUiProps {
    message: OpenAI.Chat.ChatCompletionMessageParam;
}

const ErrorFixupToolUi: React.FC<IErrorFixupToolUiProps> = ({ message }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const messageContent = getContentStringFromMessage(message);

    if (isExpanded) {
        return (
            <div 
                className={classNames("error-fixup-container", "error-fixup-expanded")}
                onClick={() => setIsExpanded(false)}
            >
                {messageContent}
            </div>
        );
    }

    return (
        <div 
            className="error-fixup-container"
            onClick={() => setIsExpanded(true)}
        >
            <div className="error-fixup-content">
                <ErrorIcon />
                <span>Error detected - click to view details</span>
            </div>
        </div>
    );
};

export default ErrorFixupToolUi;
