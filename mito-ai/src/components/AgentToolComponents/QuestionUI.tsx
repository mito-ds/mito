/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { Question } from '../../websockets/completions/CompletionModels';
import '../../../style/QuestionUI.css';

interface QuestionUIProps {
    question: Question;
    onAnswer?: (selectedOption: string) => void;
}

const QuestionUI: React.FC<QuestionUIProps> = ({ question, onAnswer }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleOptionSelect = (option: string) => {
        setSelectedOption(option);
        if (onAnswer) {
            onAnswer(option);
        }
    };

    return (
        <div className="question-ui-container">
            <div className="question-ui-header">
                <div className="question-icon">?</div>
                <span className="question-label">Question</span>
            </div>
            <div className="question-text">
                {question.question_text}
            </div>
            <div className="question-options">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        className={`question-option ${selectedOption === option ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect(option)}
                    >
                        <div className="option-radio">
                            {selectedOption === option && <div className="option-radio-inner" />}
                        </div>
                        <span className="option-text">{option}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuestionUI;