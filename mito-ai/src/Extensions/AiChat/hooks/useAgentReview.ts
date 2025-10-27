/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useRef } from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import { AIOptimizedCell } from '../../../websockets/completions/CompletionModels';
import {
    acceptSingleCellEdit,
    rejectSingleCellEdit,
    acceptAllCellEdits,
    rejectAllCellEdits
} from '../AgentReviewUtils';
import {
    getCodeDiffsAndUnifiedCodeString,
    applyDiffStripesToCell
} from '../../../utils/codeDiff';
import {
    getAIOptimizedCellsInNotebookPanel,
    writeCodeToCellByID,
    highlightCodeCell,
    scrollToCell
} from '../../../utils/notebook';
import { ChangedCell } from '../ChatTaskpane';

interface UseAgentReviewProps {
    notebookTracker: INotebookTracker;
    agentTargetNotebookPanelRef: React.MutableRefObject<any> | null;
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>;
    updateCellToolbarButtons: () => void;
}

export const useAgentReview = ({
    notebookTracker,
    agentTargetNotebookPanelRef,
    codeDiffStripesCompartments,
    updateCellToolbarButtons
}: UseAgentReviewProps): {
    // State
    changedCellsRef: React.MutableRefObject<ChangedCell[]>;
    notebookSnapshotPreAgentExecutionRef: React.MutableRefObject<AIOptimizedCell[] | null>;
    notebookSnapshotAfterAgentExecutionRef: React.MutableRefObject<AIOptimizedCell[] | null>;
    agentTargetNotebookPanelRef: React.MutableRefObject<any> | null;

    // Functions
    acceptAICodeInAgentMode: () => void;
    rejectAICodeInAgentMode: () => void;
    acceptAllAICode: () => void;
    rejectAllAICode: () => void;
    reviewAgentChanges: () => void;
    clearAgentReviewDiffs: () => void;
    setNotebookSnapshotPreAgentExecution: (snapshot: AIOptimizedCell[] | null) => void;
} => {
    // Store the changedCells array for use in scrollToNextCellWithDiff
    const changedCellsRef = useRef<ChangedCell[]>([]);

    // Store notebook snapshots for comparison
    const notebookSnapshotPreAgentExecutionRef = useRef<AIOptimizedCell[] | null>(null);
    const notebookSnapshotAfterAgentExecutionRef = useRef<AIOptimizedCell[] | null>(null);

    const acceptAICodeInAgentMode = (): void => {
        const activeCellId = notebookTracker.activeCell?.model.id;

        if (!activeCellId) {
            return;
        }

        // Check if the active cell has unreviewed changes
        const hasUnreviewedChanges = changedCellsRef.current.some(cell => cell.cellId === activeCellId && !cell.reviewed);
        if (!hasUnreviewedChanges) {
            return;
        }

        acceptSingleCellEdit(
            activeCellId,
            notebookTracker,
            notebookSnapshotAfterAgentExecutionRef.current,
            codeDiffStripesCompartments,
            changedCellsRef.current,
            agentTargetNotebookPanelRef || undefined
        );
        updateCellToolbarButtons();
    };

    const rejectAICodeInAgentMode = (): void => {
        const activeCellId = notebookTracker.activeCell?.model.id;

        if (!activeCellId) {
            return;
        }

        // Check if the active cell has unreviewed changes
        const hasUnreviewedChanges = changedCellsRef.current.some(cell => cell.cellId === activeCellId && !cell.reviewed);
        if (!hasUnreviewedChanges) {
            return;
        }

        rejectSingleCellEdit(
            activeCellId,
            notebookTracker,
            codeDiffStripesCompartments,
            changedCellsRef.current,
            agentTargetNotebookPanelRef || undefined
        );
        updateCellToolbarButtons();
    };

    const acceptAllAICode = (): void => {
        acceptAllCellEdits(
            notebookTracker,
            notebookSnapshotAfterAgentExecutionRef.current,
            codeDiffStripesCompartments,
            changedCellsRef.current
        );
        updateCellToolbarButtons();
    };

    const rejectAllAICode = (): void => {
        rejectAllCellEdits(
            notebookTracker,
            codeDiffStripesCompartments,
            changedCellsRef.current
        );
        updateCellToolbarButtons();
    };

    const reviewAgentChanges = (): void => {
        if (!agentTargetNotebookPanelRef?.current) {
            return;
        }

        const currentNotebookSnapshot = getAIOptimizedCellsInNotebookPanel(agentTargetNotebookPanelRef.current);
        notebookSnapshotAfterAgentExecutionRef.current = currentNotebookSnapshot;

        if (!notebookSnapshotPreAgentExecutionRef.current || !currentNotebookSnapshot) {
            return;
        }

        // Clear and populate the changed cells array
        const changedCells: ChangedCell[] = [];
        changedCellsRef.current = changedCells;

        // Compare each cell in the current snapshot with the original snapshot
        currentNotebookSnapshot.forEach(currentCell => {
            const originalCell = notebookSnapshotPreAgentExecutionRef.current?.find(cell => cell.id === currentCell.id);

            if (originalCell) {
                // Cell exists in both snapshots, check if code has changed
                if (originalCell.code !== currentCell.code) {
                    changedCells.push({
                        cellId: currentCell.id,
                        originalCode: originalCell.code,
                        currentCode: currentCell.code,
                        reviewed: false
                    });
                }
            } else {
                // Cell was added (doesn't exist in original snapshot)
                changedCells.push({
                    cellId: currentCell.id,
                    originalCode: '',
                    currentCode: currentCell.code,
                    reviewed: false
                });
            }
        });

        // Check for cells that were removed (exist in original but not in current)
        notebookSnapshotPreAgentExecutionRef.current?.forEach(originalCell => {
            const currentCell = currentNotebookSnapshot.find(cell => cell.id === originalCell.id);
            if (!currentCell) {
                // Cell was removed
                changedCells.push({
                    cellId: originalCell.id,
                    originalCode: originalCell.code,
                    currentCode: '',
                    reviewed: false
                });
            }
        });

        if (changedCells.length === 0) {
            console.log('No changes detected between snapshots');
            return;
        }

        // For each changed cell, calculate and apply diff stripes
        changedCells.forEach(change => {
            // Calculate the code diffs
            const { unifiedCodeString, unifiedDiffs } = getCodeDiffsAndUnifiedCodeString(change.originalCode, change.currentCode);

            // Write the unified code string to the cell
            writeCodeToCellByID(notebookTracker, unifiedCodeString, change.cellId);

            // Apply diff stripes to this cell
            applyDiffStripesToCell(notebookTracker, change.cellId, unifiedDiffs, codeDiffStripesCompartments.current);

            // Highlight the cell to draw attention
            highlightCodeCell(notebookTracker, change.cellId);
        });

        // Scroll to the first changed cell
        const firstChangedCell = changedCells[0];
        if (firstChangedCell && notebookTracker.currentWidget) {
            scrollToCell(notebookTracker.currentWidget, firstChangedCell.cellId, undefined, 'start');
        }

        // Update toolbar buttons to show accept/reject buttons for cells with diffs
        updateCellToolbarButtons();
    };

    const clearAgentReviewDiffs = (): void => {
        // Clear the changed cells array
        changedCellsRef.current = [];
    };

    const setNotebookSnapshotPreAgentExecution = (snapshot: AIOptimizedCell[] | null): void => {
        notebookSnapshotPreAgentExecutionRef.current = snapshot;
    };

    return {
        // State
        changedCellsRef,
        notebookSnapshotPreAgentExecutionRef,
        notebookSnapshotAfterAgentExecutionRef,
        agentTargetNotebookPanelRef,

        // Functions
        acceptAICodeInAgentMode,
        rejectAICodeInAgentMode,
        acceptAllAICode,
        rejectAllAICode,
        reviewAgentChanges,
        clearAgentReviewDiffs,
        setNotebookSnapshotPreAgentExecution
    };
};
