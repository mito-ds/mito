/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import '../../style/SelectedRuleContainer.css';
import RuleIcon from '../icons/RuleIcon';

interface SelectedRuleContainerProps {
    ruleName: string;
    onRemove: (ruleName: string) => void;
}

const SelectedRuleContainer: React.FC<SelectedRuleContainerProps> = ({ 
    ruleName, 
    onRemove 
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button 
            className="selected-rule-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`icon`}
                onClick={() => onRemove(ruleName)}
                title={isHovered ? "Remove rule" : "Selected rule"}
            >
                {isHovered ? (
                    <span className="icon">✕</span>
                ) : (
                    <RuleIcon />
                )}
            </div>
            <span className="rule-name">
                {ruleName}
            </span>
        </button>
    );
};

export default SelectedRuleContainer;
