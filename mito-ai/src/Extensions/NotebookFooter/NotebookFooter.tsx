import React from "react";
import { useCallback, useEffect, useState } from "react";
import { NotebookActions } from "@jupyterlab/notebook";
import { JupyterFrontEnd } from "@jupyterlab/application";
import { COMMAND_MITO_AI_SEND_AGENT_MESSAGE, COMMAND_MITO_AI_OPEN_CHAT } from "../../commands";
import '../../../style/NotebookFooter.css';

interface NotebookFooterProps {
    notebook: any;
    app: JupyterFrontEnd;
}

export const NotebookFooter: React.FC<NotebookFooterProps> = ({notebook, app}) => {
    const [cellCount, setCellCount] = useState(notebook.widgets.length);
    const [lastAction, setLastAction] = useState<string>('');
    const [inputValue, setInputValue] = useState('');

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

    const addCell = (cellType: 'code' | 'markdown' = 'code') => {
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

    const handleInputSubmit = () => {

        const _handleInputSubmitAsync = async () => {
            const submittedInput = inputValue.trim();
            if (submittedInput !== '') {
                setInputValue('');
                await app.commands.execute(COMMAND_MITO_AI_OPEN_CHAT, { focusChatInput: false });
                await app.commands.execute(COMMAND_MITO_AI_SEND_AGENT_MESSAGE, { input: submittedInput });
            }
        }

        void _handleInputSubmitAsync();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Prevent JupyterLab from intercepting keyboard events
        e.stopPropagation();
        
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleInputSubmit();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        // Prevent JupyterLab from intercepting keyboard events
        e.stopPropagation();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        setInputValue(e.target.value);
    };

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        // Ensure the input stays focused
        e.stopPropagation();
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        e.stopPropagation();
    };

    return (
        <div className="notebook-footer-container">
            {/* Input field */}
            <div className="input-container">
                <div className="input-wrapper">
                    <div className="input-icon-left">
                        ✦
                    </div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onKeyPress={handleKeyPress}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        placeholder="What can I help you build?"
                        className="prompt-input"
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <div className="input-icons-right">
                        <button 
                            className="input-action-button"
                            onClick={() => {
                                // TODO: Implement add functionality
                                console.log('Add clicked');
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            ⊕
                        </button>
                        <button 
                            className="input-action-button submit-button"
                            onClick={handleInputSubmit}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            ▷
                        </button>
                    </div>
                </div>
            </div>

            {/* Button row */}
            <div className="button-row">
                {/* Python button */}
                <button
                    onClick={() => addCell('code')}
                    className="footer-button python-button"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="button-content">
                        <div className="button-icon">
                            {/* Icon placeholder - will be replaced with logo later */}
                            🐍
                        </div>
                        <span className="button-label">Python</span>
                    </div>
                </button>

                {/* Text button */}
                <button
                    onClick={() => addCell('markdown')}
                    className="footer-button text-button"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="button-content">
                        <div className="button-icon">
                            {/* Icon placeholder - will be replaced with logo later */}
                            📝
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