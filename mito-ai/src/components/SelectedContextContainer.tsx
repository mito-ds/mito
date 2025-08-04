/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import '../../style/SelectedContextContainer.css';
import RuleIcon from '../icons/RuleIcon';
import CodeIcon from '../icons/CodeIcon';
import DatabaseIcon from '../icons/DatabaseIcon';
import { highlightCodeCell, getCellByID } from '../utils/notebook';

interface SelectedContextContainerProps {
    title: string;
    type: string;
    onRemove: () => void;
    onClick?: () => void;
    notebookTracker?: any;
    activeCellID?: string;
}

const SelectedContextContainer: React.FC<SelectedContextContainerProps> = ({
    title,
    type,
    onRemove,
    onClick,
    notebookTracker,
    activeCellID
}) => {
    const [isHovered, setIsHovered] = useState(false);

    let icon = <RuleIcon />;
    switch (type) {
        case 'rule':
            icon = <RuleIcon />;
            break;
        case 'variable':
            icon = <CodeIcon />;
            break;
        case 'db':
            icon = <DatabaseIcon />;
            break;
        case 'active_cell':
            icon = <CodeIcon />;
            break;
    }

    const handleClick = (): void => {
        if (type === 'active_cell') {
            // Handle active cell context click
            if (notebookTracker && activeCellID) {
                // Find the cell 
                const cell = getCellByID(notebookTracker, activeCellID);
                if (cell) {
                    // Scroll to the cell
                    void notebookTracker.currentWidget?.content.scrollToCell(cell, 'center');
                    // Highlight the cell
                    setTimeout(() => {
                        highlightCodeCell(notebookTracker, activeCellID);
                    }, 500);
                }
            }
            // If notebookTracker or activeCellID are not available, do nothing
        } else if (onClick) {
            // Call the custom onClick handler for other context types
            onClick();
        }
    };

    return (
        <button
            className="selected-context-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            data-testid="selected-context-container"
        >
            <div
                className={`icon`}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the button's onClick
                    onRemove();
                }}
                title={isHovered ? "Remove rule" : "Selected rule"}
            >
                {isHovered && type !== 'active_cell' ? (
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
