/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getCellIndexByID } from '../../../utils/notebook';
import '../../../../style/CellReference.css';

export interface CellReferenceProps {
  cellId: string;
  notebookTracker: INotebookTracker;
}

export const CellReference: React.FC<CellReferenceProps> = ({ 
  cellId, 
  notebookTracker 
}) => {
  // Get the cell index (1-based for display) from the cell ID
  const cellIndex = getCellIndexByID(notebookTracker, cellId);
  const displayIndex = cellIndex !== undefined ? cellIndex + 1 : '?';

  const handleClick = (): void => {
    // Navigate to the cell when clicked
    const notebook = notebookTracker.currentWidget?.content;
    if (notebook && cellIndex !== undefined) {
      // Set the active cell to the referenced cell
      notebook.activeCellIndex = cellIndex;
      
      // Scroll the cell into view
      const cellWidget = notebook.widgets[cellIndex];
      if (cellWidget) {
        cellWidget.node.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  };

  return (
    <span 
      className="cell-reference" 
      onClick={handleClick}
      title={`Jump to Cell ${displayIndex}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      Cell {displayIndex}
    </span>
  );
};