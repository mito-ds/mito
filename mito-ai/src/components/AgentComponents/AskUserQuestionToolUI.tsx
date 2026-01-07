/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { classNames } from '../../utils/classNames';
import '../../../style/AgentToolUIComponent.css';
import '../../../style/AskUserQuestionToolUI.css';
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
    const handleAnswerClick = (answer: string): void => {
        if (onAnswerSelected) {
            onAnswerSelected(answer);
        }
    };

    return (
        <div className={classNames('agent-tool-ui-container', 'ask-user-question-container')}>
            <div className="agent-tool-ui-content">
                <QuestionIcon />
                <div className="ask-user-question-content">
                    {message && (
                        <div className="ask-user-question-message">
                            {message}
                        </div>
                    )}
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
