/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import '../../style/SelectedContextContainer.css';
import RuleIcon from '../icons/RuleIcon';
import CodeIcon from '../icons/CodeIcon';
import DatabaseIcon from '../icons/DatabaseIcon';
import PhotoIcon from '../icons/PhotoIcon';
import { highlightCodeCell, getCellByID, scrollToCell, highlightLinesOfCodeInCodeCell } from '../utils/notebook';

interface SelectedContextContainerProps {
    title: string;
    type: string;
    onRemove: () => void;
    onClick?: () => void;
    notebookTracker?: any;
    activeCellID?: string;
    value?: string;  // The underlying value (e.g., cellId for cell type)
}

const SelectedContextContainer: React.FC<SelectedContextContainerProps> = ({
    title,
    type,
    onRemove,
    onClick,
    notebookTracker,
    activeCellID,
    value
}) => {
    const [isHovered, setIsHovered] = useState(false);

    let icon = <RuleIcon />;

    if (type.startsWith('image/')) {
        icon = <PhotoIcon />;
    } else if (type === 'rule') {
        icon = <RuleIcon />;
    } else if (type === 'variable') {
        icon = <CodeIcon />;
    } else if (type === 'db') {
        icon = <DatabaseIcon />;
    } else if (type === 'active_cell') {
        icon = <CodeIcon />;
    } else if (type === 'notebook') {
        icon = <CodeIcon />;
    } else if (type === 'cell') {
        icon = <CodeIcon />;
    } else if (type === 'line_selection') {
        icon = <CodeIcon />;
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
        } else if (type === 'cell' && notebookTracker && value) {
            // Handle cell context click - scroll to the cell
            if (notebookTracker.currentWidget) {
                scrollToCell(notebookTracker.currentWidget, value, undefined, 'center');
            }
            // Highlight the cell
            setTimeout(() => {
                highlightCodeCell(notebookTracker, value);
            }, 500);
        } else if (type === 'line_selection' && notebookTracker && value) {
            // Handle line selection context click - scroll to and highlight selected lines
            try {
                const selectionInfo = JSON.parse(value);
                const currentWidget = notebookTracker.currentWidget;
                if (currentWidget) {
                    // Scroll to the cell, positioning based on the start line
                    // Lines are stored 0-indexed, matching the citation format
                    scrollToCell(currentWidget, selectionInfo.cellId, selectionInfo.startLine, 'center');
                    // Highlight the selected lines
                    setTimeout(() => {
                        // Re-check currentWidget inside the callback since it may have changed
                        const widget = notebookTracker.currentWidget;
                        if (widget) {
                            highlightLinesOfCodeInCodeCell(
                                widget,
                                selectionInfo.cellId,
                                selectionInfo.startLine,
                                selectionInfo.endLine
                            );
                        }
                    }, 500);
                }
            } catch {
                // Ignore JSON parse errors
            }
        } else if (onClick) {
            // Call the custom onClick handler for other context types
            onClick();
        }
    };

    const getTooltipText = (): string => {
        if (type.startsWith('image/')) {
            return `The AI will be able to view the ${title} image before deciding how to respond`;
        } else if (type === 'file') {
            return `The path ${title} will be shared with the AI`;
        } else if (type === 'notebook') {
            return "The AI will be able to read all of the code and markdown in your notebook. It is included by default in Agent mode.";
        } else if (type === 'active_cell') {
            return "The AI will write its code based on the currently active cell. It is included by default in Chat mode.";
        } else if (type === 'cell') {
            return `The AI will be able to see the code in ${title}`;
        } else if (type === 'variable') {
            return `The AI will receive a summary of the ${title} variable`;
        } else if (type === 'rule') {
            return `The AI will be guided by the ${title} rule`;
        } else if (type === 'db') {
            return `The AI will be able to access the ${title} database connection`;
        }
        return "This context will be included in your message to help the AI understand what you're working with";
    };

    return (
        <button
            className="selected-context-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            data-testid="selected-context-container"
            data-type={type}
            title={getTooltipText()}
        >
            <div
                className={`icon`}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the button's onClick
                    onRemove();
                }}
                title={isHovered ? "Remove rule" : "Selected rule"}
            >
                {isHovered && type !== 'active_cell' && type !== 'notebook' && type !== 'line_selection' ? (
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
