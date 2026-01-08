/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { classNames } from '../../utils/classNames';
import '../../../style/AgentToolUIComponent.css';
import '../../../style/AskUserQuestionToolUI.css';
import '../../../style/AgentComponentHeader.css';
import AgentComponentHeader from './AgentComponentHeader';
import QuestionIcon from '../../icons/QuestionIcon';

interface AskUserQuestionToolUIProps {
    message: string;
    question: string;
    answers?: string[] | null;
    onAnswerSelected?: (answer: string) => void;
    isLastMessage?: boolean;
}

const AskUserQuestionToolUI: React.FC<AskUserQuestionToolUIProps> = ({
    message,
    question,
    answers,
    onAnswerSelected,
    isLastMessage = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAnswerClick = (answer: string): void => {
        if (onAnswerSelected) {
            onAnswerSelected(answer);
        }
    };

    return (
        <div className={classNames('ask-user-question-container', {
            'ask-user-question-container-active': isLastMessage,
        })}>
            {isLastMessage && (
                <div className="ask-user-question-header-label">
                    [Action Required]: Question for you
                </div>
            )}
            <AgentComponentHeader
                icon={<QuestionIcon />}
                text={question}
                onClick={() => setIsExpanded(!isExpanded)}
                isExpanded={isExpanded}
                displayBorder={true}
            />
            {isExpanded && (
                <div className="ask-user-question-content">
                    {answers && answers.length > 0 && (
                        <ul className="ask-user-question-answers">
                            {answers.map((answer, index) => (
                                <li
                                    key={index}
                                    className={isLastMessage ? "ask-user-question-answer-text-clickable" : "ask-user-question-answer-text"}
                                    onClick={isLastMessage ? () => handleAnswerClick(answer) : undefined}
                                    title={isLastMessage ? answer : undefined}
                                >
                                    {answer}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default AskUserQuestionToolUI;
