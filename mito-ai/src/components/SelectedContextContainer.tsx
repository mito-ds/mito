/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import '../../style/SelectedContextContainer.css';
import RuleIcon from '../icons/RuleIcon';
import CodeIcon from '../icons/CodeIcon';

interface SelectedContextContainerProps {
    title: string;
    type: string;
    onRemove: () => void;
}

const SelectedContextContainer: React.FC<SelectedContextContainerProps> = ({ title, type, onRemove }) => {
    const [isHovered, setIsHovered] = useState(false);

    let icon = <RuleIcon />;
    switch (type) {
        case 'rule':
            icon = <RuleIcon />;
            break;
        case 'variable':
            icon = <CodeIcon />;
            break;
    }

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
                    <span className="remove-icon">X</span>
                ) : (
                    <span className="icon">{icon}</span>
                )}
            </div>
            <span className="rule-name">
                {title}
            </span>
        </button>
    );
};

export default SelectedContextContainer;
