/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { classNames } from '../../utils/classNames';
import '../../../style/AgentToolUIComponent.css';
import '../../../style/AskUserQuestionToolUI.css';
import QuestionIcon from '../../icons/QuestionIcon';
import AgentComponentHeader from './AgentComponentHeader';

interface AskUserQuestionToolUIProps {
    question: string;
    answers?: string[] | null;
    onAnswerSelected?: (answer: string) => void;
    isLastMessage?: boolean;
}

const AskUserQuestionToolUI: React.FC<AskUserQuestionToolUIProps> = ({
    question,
    answers,
    onAnswerSelected,
    isLastMessage = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const cleanedAnswers = answers?.filter(answer => answer.trim() !== '');

    const handleAnswerClick = (answer: string): void => {
        if (onAnswerSelected) {
            onAnswerSelected(answer);
        }
    };

    if (question.trim() === '') {
        return null;
    }

    // Collapsed mode: show as expandable item like Cell Updates
    if (!isLastMessage) {
        return (
            <div className={classNames('ask-user-question-collapsed', { expanded: isExpanded })}>
                <AgentComponentHeader
                    icon={<QuestionIcon />}
                    text={question}
                    onClick={() => setIsExpanded(!isExpanded)}
                    isExpanded={isExpanded}
                    displayBorder={true}
                />
                {isExpanded && cleanedAnswers && cleanedAnswers.length > 0 && (
                    <div className="ask-user-question-expanded-content">
                        <ul className="ask-user-question-collapsed-answers">
                            {cleanedAnswers.map((answer, index) => (
                                <li key={index}>{answer}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    // Active mode: show interactive UI with clickable buttons and purple glow
    return (
        <div className={classNames('agent-tool-ui-container', 'ask-user-question-container', 'ask-user-question-active')}>
            <div className="agent-tool-ui-content">
                <div className="ask-user-question-pill">
                    <QuestionIcon />
                    <span className="ask-user-question-pill-text">User Question</span>
                </div>
                <div className="ask-user-question-content">
                    <div className="ask-user-question-question">
                        {question}
                    </div>
                    {cleanedAnswers && cleanedAnswers.length > 0 && (
                        <div className="ask-user-question-answers">
                            {cleanedAnswers.map((answer, index) => (
                                <button
                                    key={index}
                                    className="ask-user-question-answer-button"
                                    onClick={() => handleAnswerClick(answer)}
                                    title={answer}
                                >
                                    <svg 
                                        className="ask-user-question-radio-icon"
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 16 16" 
                                        fill="none" 
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                    </svg>
                                    <span className="ask-user-question-answer-text">{answer}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="ask-user-question-subtext">
                        {cleanedAnswers && cleanedAnswers.length > 0 ? 'Or respond in the Chat Input below' : 'Respond in the Chat Input below'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AskUserQuestionToolUI;
