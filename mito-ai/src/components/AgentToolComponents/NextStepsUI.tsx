/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../../style/NextStepsUI.css';

interface NextStepsUIProps {
    nextSteps: string[];
    onSelectNextStep?: (nextStep: string) => void;
}

const NextStepsUI: React.FC<NextStepsUIProps> = ({ nextSteps, onSelectNextStep }) => {
    const handleNextStepClick = (nextStep: string) => {
        if (onSelectNextStep) {
            onSelectNextStep(nextStep);
        }
    };

    return (
        <div className="next-steps-ui-container">
            <div className="next-steps-ui-header">
                <div className="next-steps-icon">→</div>
                <span className="next-steps-label">Suggested Next Steps</span>
            </div>
            <div className="next-steps-list">
                {nextSteps.map((nextStep, index) => (
                    <button
                        key={index}
                        className="next-step-button"
                        onClick={() => handleNextStepClick(nextStep)}
                    >
                        <div className="next-step-icon">▶</div>
                        <span className="next-step-text">{nextStep}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default NextStepsUI; 