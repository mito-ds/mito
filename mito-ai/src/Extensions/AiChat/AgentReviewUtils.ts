/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from '@jupyterlab/notebook';
import {
    writeCodeToCellByID,
    scrollToNextCellWithDiff
} from '../../utils/notebook';
import { turnOffDiffsForCell } from '../../utils/codeDiff';
import { runCellByIDInBackground } from '../../utils/notebook';
import { ChangedCell } from './ChatTaskpane';
import { AIOptimizedCell } from '../../websockets/completions/CompletionModels';

/**
 * Accepts a single cell edit in agent review mode
 */
export const acceptSingleCellEdit = (
    cellId: string,
    notebookTracker: INotebookTracker,
    notebookSnapshotAfterAgentExecution: AIOptimizedCell[] | null,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>,
    changedCells: ChangedCell[],
    agentTargetNotebookPanelRef?: React.MutableRefObject<any>
): void => {
    // Find the final code from the current notebook snapshot
    const edit = notebookSnapshotAfterAgentExecution?.find(cell => cell.id === cellId);
    const changedCell = changedCells.find(cell => cell.cellId === cellId);
    if (changedCell) {
        changedCell.reviewed = true;
    }

    // Write the final code to the cell and turn off diffs
    writeCodeToCellByID(notebookTracker, edit?.code || '', cellId);
    turnOffDiffsForCell(notebookTracker, cellId, codeDiffStripesCompartments.current);

    // Scroll to the next cell with a diff if in agent mode
    scrollToNextCellWithDiff(
        agentTargetNotebookPanelRef?.current,
        cellId,
        changedCells
    );
};

/**
 * Rejects a single cell edit in agent review mode
 */
export const rejectSingleCellEdit = (
    cellId: string,
    notebookTracker: INotebookTracker,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>,
    changedCells: ChangedCell[],
    agentTargetNotebookPanelRef?: React.MutableRefObject<any>
): void => {
    const changedCell = changedCells.find(cell => cell.cellId === cellId);
    if (!changedCell) return;

    // Mark as reviewed and restore original code
    changedCell.reviewed = true;
    writeCodeToCellByID(notebookTracker, changedCell.originalCode, cellId);
    turnOffDiffsForCell(notebookTracker, cellId, codeDiffStripesCompartments.current);

    // Re-run the rejected cell in background. We want to make sure that the agent has the 
    // most up-to-date version of every variable. 
    void runCellByIDInBackground(notebookTracker.currentWidget, cellId);

    // Scroll to the next cell with a diff if in agent mode
    scrollToNextCellWithDiff(
        agentTargetNotebookPanelRef?.current,
        cellId,
        changedCells
    );
};

/**
 * Accepts all cell edits in agent review mode
 */
export const acceptAllCellEdits = (
    notebookTracker: INotebookTracker,
    notebookSnapshotAfterAgentExecution: AIOptimizedCell[] | null,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>,
    changedCells: ChangedCell[]
): void => {
    // Look for all cells with diffs
    const unreviewedCells = changedCells.filter(cell => !cell.reviewed);
    if (unreviewedCells.length === 0) {
        return;
    }

    // Accept all cells that have diffs
    unreviewedCells.forEach(changedCell => {
        // Find the final code from the current notebook snapshot
        const edit = notebookSnapshotAfterAgentExecution?.find(cell => cell.id === changedCell.cellId);
        if (edit) {
            // Mark as reviewed
            changedCell.reviewed = true;
            // Write the final code to the cell and turn off diffs
            writeCodeToCellByID(notebookTracker, edit.code, changedCell.cellId);
            turnOffDiffsForCell(notebookTracker, changedCell.cellId, codeDiffStripesCompartments.current);
        }
    });
};

/**
 * Rejects all cell edits in agent review mode
 */
export const rejectAllCellEdits = (
    notebookTracker: INotebookTracker,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>,
    changedCells: ChangedCell[]
): void => {
    // Look for all cells with diffs
    const unreviewedCells = changedCells.filter(cell => !cell.reviewed);
    if (unreviewedCells.length === 0) {
        return;
    }

    // Reject all cells that have diffs
    unreviewedCells.forEach(changedCell => {
        // Mark as reviewed and restore original code
        changedCell.reviewed = true;
        writeCodeToCellByID(notebookTracker, changedCell.originalCode, changedCell.cellId);
        turnOffDiffsForCell(notebookTracker, changedCell.cellId, codeDiffStripesCompartments.current);

        // Re-run the rejected cell in background. We want to make sure that the agent has the 
        // most up-to-date version of every variable.
        void runCellByIDInBackground(notebookTracker.currentWidget, changedCell.cellId);
    });
};