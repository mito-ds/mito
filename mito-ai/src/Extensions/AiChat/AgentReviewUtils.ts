/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { scrollToNextCellWithDiff, writeCodeToCellByIDInNotebookPanel } from '../../utils/notebook';
import { turnOffDiffsForCell } from '../../utils/codeDiff';
import { runCellByIDInBackground } from '../../utils/notebook';
import { AgentReviewStatus, ChangedCell } from './ChatTaskpane';
import { AIOptimizedCell } from '../../websockets/completions/CompletionModels';

/**
 * Accepts a single cell edit in agent review mode
 */
export const acceptSingleCellEdit = (
    cellId: string,
    notebookPanel: NotebookPanel,
    notebookSnapshotAfterAgentExecution: AIOptimizedCell[] | null,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>,
    changedCells: ChangedCell[],
    setAgentReviewStatus: (status: AgentReviewStatus) => void,
): void => {
    // Find the final code from the current notebook snapshot
    const edit = notebookSnapshotAfterAgentExecution?.find(cell => cell.id === cellId);
    const changedCell = changedCells.find(cell => cell.cellId === cellId);
    if (changedCell) {
        changedCell.reviewed = true;
    }

    // Write the final code to the cell and turn off diffs
    writeCodeToCellByIDInNotebookPanel(notebookPanel, edit?.code || '', cellId);
    turnOffDiffsForCell(notebookPanel, cellId, codeDiffStripesCompartments.current);

    // Scroll to the next cell with a diff if in agent mode
    scrollToNextCellWithDiff(
        notebookPanel,
        cellId,
        changedCells,
        setAgentReviewStatus
    );
};

/**
 * Rejects a single cell edit in agent review mode
 */
export const rejectSingleCellEdit = (
    cellId: string,
    notebookPanel: NotebookPanel,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>,
    changedCells: ChangedCell[],
    setAgentReviewStatus: (status: AgentReviewStatus) => void,
    agentTargetNotebookPanelRef?: React.MutableRefObject<any>,
): void => {
    const changedCell = changedCells.find(cell => cell.cellId === cellId);
    if (!changedCell) return;

    // Mark as reviewed and restore original code
    changedCell.reviewed = true;
    writeCodeToCellByIDInNotebookPanel(notebookPanel, changedCell.originalCode, cellId)
    turnOffDiffsForCell(notebookPanel, cellId, codeDiffStripesCompartments.current);

    // Re-run the rejected cell in background. We want to make sure that the agent has the 
    // most up-to-date version of every variable. 
    void runCellByIDInBackground(notebookPanel, cellId);

    // Scroll to the next cell with a diff if in agent mode
    scrollToNextCellWithDiff(
        agentTargetNotebookPanelRef?.current,
        cellId,
        changedCells,
        setAgentReviewStatus
    );
};

/**
 * Accepts all cell edits in agent review mode
 */
export const acceptAllCellEdits = (
    notebookPanel: NotebookPanel | undefined,
    notebookSnapshotAfterAgentExecution: AIOptimizedCell[] | null,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>,
    changedCells: ChangedCell[]
): void => {
    // Look for all cells with diffs
    const unreviewedCells = changedCells.filter(cell => !cell.reviewed);
    if (unreviewedCells.length === 0 || !notebookPanel) {
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
            writeCodeToCellByIDInNotebookPanel(notebookPanel, edit.code, changedCell.cellId);
            turnOffDiffsForCell(notebookPanel, changedCell.cellId, codeDiffStripesCompartments.current);
        }
    });
};

/**
 * Rejects all cell edits in agent review mode
 */
export const rejectAllCellEdits = (
    notebookPanel: NotebookPanel | undefined,
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>,
    changedCells: ChangedCell[]
): void => {
    // Look for all cells with diffs
    const unreviewedCells = changedCells.filter(cell => !cell.reviewed);
    if (unreviewedCells.length === 0 || !notebookPanel) {
        return;
    }

    // Reject all cells that have diffs
    unreviewedCells.forEach(changedCell => {
        // Mark as reviewed and restore original code
        changedCell.reviewed = true;
        writeCodeToCellByIDInNotebookPanel(notebookPanel, changedCell.originalCode, changedCell.cellId);
        turnOffDiffsForCell(notebookPanel, changedCell.cellId, codeDiffStripesCompartments.current);

        // Re-run the rejected cell in background. We want to make sure that the agent has the 
        // most up-to-date version of every variable.
        void runCellByIDInBackground(notebookPanel, changedCell.cellId);
    });
};