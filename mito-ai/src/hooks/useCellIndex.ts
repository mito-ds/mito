/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState, useEffect } from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getCellIndexByID } from '../utils/notebook';
import { notebookChangeEmitter } from '../Extensions/NotebookChangeTracker/notebookChangeEmitter';

/**
 * Hook that provides the current cell index for a given cell ID
 * and automatically updates when the notebook structure changes.
 */
export const useCellIndex = (cellId: string, notebookTracker: INotebookTracker): number | undefined => {
  // Initialize with current cell index
  const [cellIndex, setCellIndex] = useState<number | undefined>(() => {
    return getCellIndexByID(notebookTracker, cellId);
  });

  useEffect(() => {
    // Function to update the cell index
    const updateCellIndex = (): void => {
      const newIndex = getCellIndexByID(notebookTracker, cellId);
      setCellIndex(newIndex);
    };

    // Subscribe to cellListChanged events
    const unsubscribe = notebookChangeEmitter.onCellListChanged(updateCellIndex);

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [cellId, notebookTracker]);

  return cellIndex;
};