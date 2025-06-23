/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import { useCellIndex } from '../../../hooks/useCellIndex';
import '../../../../style/CellReference.css';
import { scrollToCell } from '../../../utils/notebook';

export interface CellReferenceProps {
  cellId: string;
  notebookTracker: INotebookTracker;
}

export const CellReference: React.FC<CellReferenceProps> = ({ 
  cellId, 
  notebookTracker 
}) => {
  // Get the cell index (automatically updates when notebook changes)
  const cellIndex = useCellIndex(cellId, notebookTracker);
  const displayIndex = cellIndex !== undefined ? cellIndex + 1 : '?';

  return (
    <button 
      className="cell-reference" 
      onClick={() => scrollToCell(notebookTracker, cellId)}
      title={`Jump to Cell ${displayIndex}`}
    >
      Cell {displayIndex}
    </button>
  );
};