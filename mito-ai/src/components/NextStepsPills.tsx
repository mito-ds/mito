/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import '../../style/NextStepsPills.css';

interface NextStepsPillsProps {
    nextSteps: string[];
    onSelectNextStep?: (nextStep: string) => void;
}

const NextStepsPills: React.FC<NextStepsPillsProps> = ({ nextSteps, onSelectNextStep }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (nextSteps.length > 0) {
            // Small delay to trigger the entrance animation
            const timer = setTimeout(() => setIsVisible(true), 50);
            return () => clearTimeout(timer);
        }
        return () => {}; // Return empty cleanup function for the else case
    }, [nextSteps.length]);

    const handleNextStepClick = (nextStep: string) => {
        // Start exit animation
        setIsAnimatingOut(true);
        
        // Call the callback after a short delay to allow animation
        setTimeout(() => {
            if (onSelectNextStep) {
                onSelectNextStep(nextStep);
            }
        }, 150);
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    if (nextSteps.length === 0) {
        return null;
    }

    return (
        <div className={`next-steps-pills-container ${isVisible ? 'visible' : ''} ${isAnimatingOut ? 'animating-out' : ''}`}>
            <div className="next-steps-header" onClick={toggleExpanded}>
                <div className={`next-steps-caret ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    ▼
                </div>
                <span className="next-steps-title">Suggested Next Steps</span>
            </div>
            {isExpanded && (
                <div className="next-steps-pills-list">
                    {nextSteps.map((nextStep, index) => (
                        <button
                            key={index}
                            className="next-step-pill"
                            onClick={() => handleNextStepClick(nextStep)}
                            title={nextStep}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <span className="next-step-pill-text">{nextStep}</span>
                            <div className="next-step-pill-icon">→</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NextStepsPills; 