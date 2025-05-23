/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import '../../style/SelectedContextContainer.css';
import RuleIcon from '../icons/RuleIcon';

interface SelectedContextContainerProps {
    title: string;
    onRemove: () => void;
}

const SelectedContextContainer: React.FC<SelectedContextContainerProps> = ({ title, onRemove }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button 
            className="selected-context-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            data-testid="selected-context-container"
        >
            <div
                className={`icon`}
                onClick={() => onRemove()}
                title={isHovered ? "Remove rule" : "Selected rule"}
            >
                {isHovered ? (
                    <span className="icon">✕</span>
                ) : (
                    <RuleIcon />
                )}
            </div>
            <span className="rule-name">
                {title}
            </span>
        </button>
    );
};

export default SelectedContextContainer;
