/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from "@jupyterlab/notebook"
import { getCellIndexByIDInNotebookPanel, getCellIDByIndexInNotebookPanel } from "../../utils/notebook"
import { CellUpdate } from "../../websockets/completions/CompletionModels"

export const getCellIdFromCellUpdate = (cellUpdate: CellUpdate | null | undefined, notebookTracker: INotebookTracker): string | undefined => {
    if (!cellUpdate) {
        return undefined;
    }
    if (cellUpdate.type === 'modification') {
        return cellUpdate.id;
    }
    // For 'new' type, find the cell that was inserted after after_cell_id
    const notebookPanel = notebookTracker.currentWidget;
    if (!notebookPanel) {
        return undefined;
    }
    
    if (cellUpdate.after_cell_id === 'new cell') {
        // New cell was inserted at the top, so it's at index 0
        return getCellIDByIndexInNotebookPanel(notebookPanel, 0);
    }
    
    // Get the index of the cell we inserted after, then get the next cell's ID
    const afterCellIndex = getCellIndexByIDInNotebookPanel(notebookPanel, cellUpdate.after_cell_id);
    if (afterCellIndex === undefined) {
        return undefined;
    }
    
    // The new cell is at index afterCellIndex + 1
    return getCellIDByIndexInNotebookPanel(notebookPanel, afterCellIndex + 1);
}

