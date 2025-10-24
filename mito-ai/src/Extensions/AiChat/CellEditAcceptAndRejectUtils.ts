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
export const AcceptSingleCellEdit = (
    cellId: string,
    notebookTracker: INotebookTracker,
    cellStatesBeforeDiff: React.MutableRefObject<Map<string, string>>,
    notebookSnapshotAfterAgentExecution: AIOptimizedCell[] | null,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>,
    changedCells: ChangedCell[],
    agentTargetNotebookPanelRef?: React.MutableRefObject<any>
): void => {
    // Remove the cell from tracking
    cellStatesBeforeDiff.current.delete(cellId);

    // Find the final code from the current notebook snapshot
    const edit = notebookSnapshotAfterAgentExecution?.find(cell => cell.id === cellId);

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
export const RejectSingleCellEdit = (
    cellId: string,
    notebookTracker: INotebookTracker,
    cellStatesBeforeDiff: React.MutableRefObject<Map<string, string>>,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>,
    changedCells: ChangedCell[],
    agentTargetNotebookPanelRef?: React.MutableRefObject<any>
): void => {
    const originalCode = cellStatesBeforeDiff.current.get(cellId);
    if (originalCode === undefined) return;

    // Remove from tracking and restore original code
    cellStatesBeforeDiff.current.delete(cellId);
    writeCodeToCellByID(notebookTracker, originalCode, cellId);
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
export const AcceptAllCellEdits = (
    notebookTracker: INotebookTracker,
    cellStatesBeforeDiff: React.MutableRefObject<Map<string, string>>,
    notebookSnapshotAfterAgentExecution: AIOptimizedCell[] | null,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>
): void => {
    // Look for all cells with diffs
    if (cellStatesBeforeDiff.current.size === 0) {
        return;
    }

    // Accept all cells that have diffs
    cellStatesBeforeDiff.current.forEach((originalCode, cellId) => {
        // Find the final code from the current notebook snapshot
        const edit = notebookSnapshotAfterAgentExecution?.find(cell => cell.id === cellId);
        if (edit) {
            // Write the final code to the cell and turn off diffs
            writeCodeToCellByID(notebookTracker, edit.code, cellId);
            turnOffDiffsForCell(notebookTracker, cellId, codeDiffStripesCompartments.current);
        }
    });

    // Clear all tracking
    cellStatesBeforeDiff.current.clear();
};

/**
 * Rejects all cell edits in agent review mode
 */
export const RejectAllCellEdits = (
    notebookTracker: INotebookTracker,
    cellStatesBeforeDiff: React.MutableRefObject<Map<string, string>>,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>
): void => {
    // Look for all cells with diffs
    if (cellStatesBeforeDiff.current.size === 0) {
        return;
    }

    // Reject all cells that have diffs
    cellStatesBeforeDiff.current.forEach((originalCode, cellId) => {
        // Restore original code and turn off diffs
        writeCodeToCellByID(notebookTracker, originalCode, cellId);
        turnOffDiffsForCell(notebookTracker, cellId, codeDiffStripesCompartments.current);

        // Re-run the rejected cell in background
        void runCellByIDInBackground(notebookTracker.currentWidget, cellId);
    });

    // Clear all tracking
    cellStatesBeforeDiff.current.clear();
};

