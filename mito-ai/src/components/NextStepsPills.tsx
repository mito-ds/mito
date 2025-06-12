/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import '../../style/NextStepsPills.css';

interface NextStepsPillsProps {
    nextSteps: string[];
    onSelectNextStep?: (nextStep: string) => void;
    onDismiss?: () => void;
}

const NextStepsPills: React.FC<NextStepsPillsProps> = ({ nextSteps, onSelectNextStep, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

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

    const handleDismiss = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            if (onDismiss) {
                onDismiss();
            }
        }, 150);
    };

    if (nextSteps.length === 0) {
        return null;
    }

    return (
        <div className={`next-steps-pills-container ${isVisible ? 'visible' : ''} ${isAnimatingOut ? 'animating-out' : ''}`}>
            <div className="next-steps-pills-list">
                {nextSteps.map((nextStep, index) => (
                    <button
                        key={index}
                        className="next-step-pill"
                        onClick={() => handleNextStepClick(nextStep)}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <span className="next-step-pill-text">{nextStep}</span>
                        <div className="next-step-pill-icon">→</div>
                    </button>
                ))}
            </div>
            <button 
                className="next-steps-dismiss-button"
                onClick={handleDismiss}
                title="Dismiss suggestions"
            >
                ×
            </button>
        </div>
    );
};

export default NextStepsPills; 