import React from "react";
import { NotebookActions } from "@jupyterlab/notebook";
import { useCallback, useEffect, useState } from "react";

interface NotebookFooterProps {
    notebook: any;
}

export const NotebookFooterComponent: React.FC<NotebookFooterProps> = ({notebook}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [cellCount, setCellCount] = useState(notebook.widgets.length);
    const [lastAction, setLastAction] = useState<string>('');
    const [showDropdown, setShowDropdown] = useState(false);

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

    const addCell = (cellType: 'code' | 'markdown' | 'raw' = 'code') => {
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

        setLastAction(`Added ${cellType} cell`);
        setShowDropdown(false);
        void NotebookActions.focusActiveCell(notebook);
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Main add button */}
                <button
                    onClick={() => addCell('code')}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: isHovered ? '#45a049' : '#4CAF50',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span>🚀</span>
                    <span>Add Code Cell</span>
                </button>

                {/* Dropdown button */}
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{
                        padding: '12px 8px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    ▼
                </button>
            </div>

            {/* Cell count and last action */}
            <div style={{
                marginTop: '4px',
                fontSize: '11px',
                color: '#666',
                textAlign: 'center'
            }}>
                {cellCount} cells {lastAction && `• ${lastAction}`}
            </div>

            {/* Dropdown menu */}
            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    minWidth: '150px'
                }}>
                    <button
                        onClick={() => addCell('code')}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            cursor: 'pointer'
                        }}
                    >
                        📄 Code Cell
                    </button>
                    <button
                        onClick={() => addCell('markdown')}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            cursor: 'pointer'
                        }}
                    >
                        📝 Markdown Cell
                    </button>
                    <button
                        onClick={() => addCell('raw')}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            cursor: 'pointer'
                        }}
                    >
                        📋 Raw Cell
                    </button>
                </div>
            )}
        </div>
    );
};