import React from "react";
import { NotebookActions } from "@jupyterlab/notebook";
import { useCallback, useEffect, useState } from "react";
import '../../../style/NotebookFooter.css';

interface NotebookFooterProps {
    notebook: any;
}

export const NotebookFooter: React.FC<NotebookFooterProps> = ({notebook}) => {
    const [cellCount, setCellCount] = useState(notebook.widgets.length);
    const [lastAction, setLastAction] = useState<string>('');

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

    return (
        <div className="notebook-footer-container">
            <div className="button-row">
                {/* Python button */}
                <button
                    onClick={() => addCell('code')}
                    className="footer-button python-button"
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