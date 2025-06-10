/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import { useCallback, useEffect, useState } from "react";
import { NotebookActions } from "@jupyterlab/notebook";
import { JupyterFrontEnd } from "@jupyterlab/application";
import { COMMAND_MITO_AI_SEND_AGENT_MESSAGE, COMMAND_MITO_AI_OPEN_CHAT } from "../../commands";
import '../../../style/NotebookFooter.css';
import LoadingCircle from "../../components/LoadingCircle";
import CodeIcon from "../../icons/NotebookFooter/CodeIcon";
import TextIcon from "../../icons/NotebookFooter/TextIcon";

interface NotebookFooterProps {
    notebook: any;
    app: JupyterFrontEnd;
}

export const NotebookFooter: React.FC<NotebookFooterProps> = ({notebook, app}) => {
    const [cellCount, setCellCount] = useState(notebook.widgets.length);
    const [lastAction, setLastAction] = useState<string>('');
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const updateCellCount = useCallback(() => {
        setCellCount(notebook.widgets.length);
    }, [notebook]);

    useEffect(() => {
        if (!notebook.model) return;
        
        notebook.model.cells.changed.connect(updateCellCount);
        return () => {
            if (!notebook.model.isDisposed) {
                notebook.model.cells.changed.disconnect(updateCellCount);
            }
        };
    }, [notebook, updateCellCount]);

    const addCell = (cellType: 'code' | 'markdown' = 'code'): void => {
        if (notebook.widgets.length > 0) {
            notebook.activeCellIndex = notebook.widgets.length - 1;
        }

        if (cellType === 'code') {
            NotebookActions.insertBelow(notebook);
        } else {
            NotebookActions.insertBelow(notebook);
            // Change the cell type after insertion
            const activeCell = notebook.activeCell;
            if (activeCell && activeCell.model.type !== cellType) {
                NotebookActions.changeCellType(notebook, cellType);
            }
        }

        setLastAction(`Added ${cellType === 'code' ? 'Python' : 'Text'} cell`);
        void NotebookActions.focusActiveCell(notebook);
    };

    const handleInputSubmit = (): void => {
        const _handleInputSubmitAsync = async (): Promise<void> => {
            const submittedInput = inputValue.trim();
            if (submittedInput !== '') {
                setIsGenerating(true);
                setInputValue('');
                await app.commands.execute(COMMAND_MITO_AI_OPEN_CHAT, { focusChatInput: false });
                await app.commands.execute(COMMAND_MITO_AI_SEND_AGENT_MESSAGE, { input: submittedInput });
                setIsGenerating(false);
            }
        }

        void _handleInputSubmitAsync();
    };

    /* 
    We handle keypress events to prevent JupyterLab from intercepting keyboard events
    and taking some other action while the user is typing in this input field. Jupyter 
    might otherwise do things like: change cell type, move focus to a cell, etc. 
    */
    const handleKeyPress = (e: React.KeyboardEvent): void => {
        e.stopPropagation();
    };
    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>): void => {
        e.stopPropagation();
    };
    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
        e.stopPropagation();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        e.stopPropagation();
        setInputValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        e.stopPropagation();
        
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleInputSubmit();
        }
    };

    return (
        <div className="notebook-footer-container">
            {/* Input field */}
            <div className="input-container">
                <div className={`input-wrapper ${isGenerating ? 'generating' : ''}`}>
                    <div className="input-icon-left">
                        {isGenerating ? (
                            <LoadingCircle />
                        ) : (
                            <>✦</>
                        )}
                    </div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onKeyPress={handleKeyPress}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        placeholder={isGenerating ? 'Generating notebook...' : 'What analysis can I help you with?'}
                        className="prompt-input"
                        autoComplete="off"
                        spellCheck={false}
                        disabled={isGenerating}
                    />
                    <div className="input-icons-right">
                        <button 
                            className="input-action-button"
                            onClick={handleInputSubmit}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            ▶
                        </button>
                    </div>
                </div>
            </div>

            {/* Button row */}
            <div className="button-row">
                {/* Python button */}
                <button
                    onClick={() => addCell('code')}
                    className="footer-button"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="button-content">
                        <div className="button-icon">
                            <CodeIcon />
                        </div>
                        <span className="button-label">Python</span>
                    </div>
                </button>

                {/* Text button */}
                <button
                    onClick={() => addCell('markdown')}
                    className="footer-button"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="button-content">
                        <div className="button-icon">
                            <TextIcon />
                        </div>
                        <span className="button-label">Text</span>
                    </div>
                </button>
            </div>

            {/* Cell count and last action */}
            <div className="cell-info">
                {cellCount} cells {lastAction && `• ${lastAction}`}
            </div>
        </div>
    );
};