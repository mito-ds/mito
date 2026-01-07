/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { classNames } from '../../utils/classNames';
import '../../../style/AgentToolUIComponent.css';
import '../../../style/AskUserQuestionToolUI.css';

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
    const handleAnswerClick = (answer: string): void => {
        if (onAnswerSelected) {
            onAnswerSelected(answer);
        }
    };

    // Collapsed mode: show question + answers as bullet points
    if (!isLastMessage) {
        return (
            <div className={classNames('agent-tool-ui-container', 'ask-user-question-container', 'ask-user-question-collapsed')}>
                <div className="ask-user-question-header-label">
                    [Action Required]: Question for you
                </div>
                <div className="agent-tool-ui-content">
                    <div className="ask-user-question-collapsed-content">
                        <span className="ask-user-question-question">{question}</span>
                        {answers && answers.length > 0 && (
                            <ul className="ask-user-question-collapsed-answers">
                                {answers.map((answer, index) => (
                                    <li key={index}>{answer}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Active mode: show interactive UI with clickable buttons
    return (
        <div className={classNames('agent-tool-ui-container', 'ask-user-question-container')}>
            <div className="ask-user-question-header-label">
                [Action Required]: Question for you
            </div>
            <div className="agent-tool-ui-content">
                <div className="ask-user-question-content">
                    <div className="ask-user-question-question">
                        {question}
                    </div>
                    {answers && answers.length > 0 && (
                        <div className="ask-user-question-answers">
                            {answers.map((answer, index) => (
                                <button
                                    key={index}
                                    className="ask-user-question-answer-button"
                                    onClick={() => handleAnswerClick(answer)}
                                    title={answer}
                                >
                                    <span className="ask-user-question-answer-text">{answer}</span>
                                    <span className="ask-user-question-answer-arrow">→</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AskUserQuestionToolUI;
