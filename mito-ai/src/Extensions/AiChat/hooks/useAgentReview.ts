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
    cellStatesBeforeDiff: React.MutableRefObject<Map<string, string>>;
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
    // Store original cell states for multiple cells (used in agent review mode)
    const cellStatesBeforeDiff = useRef<Map<string, string>>(new Map());

    // Store the changedCells array for use in scrollToNextCellWithDiff
    const changedCellsRef = useRef<ChangedCell[]>([]);

    // Store notebook snapshots for comparison
    const notebookSnapshotPreAgentExecutionRef = useRef<AIOptimizedCell[] | null>(null);
    const notebookSnapshotAfterAgentExecutionRef = useRef<AIOptimizedCell[] | null>(null);

    const acceptAICodeInAgentMode = (): void => {
        const activeCellId = notebookTracker.activeCell?.model.id;

        if (!activeCellId || !cellStatesBeforeDiff.current.has(activeCellId)) {
            return;
        }

        acceptSingleCellEdit(
            activeCellId,
            notebookTracker,
            cellStatesBeforeDiff,
            notebookSnapshotAfterAgentExecutionRef.current,
            codeDiffStripesCompartments,
            changedCellsRef.current,
            agentTargetNotebookPanelRef || undefined
        );
        updateCellToolbarButtons();
    };

    const rejectAICodeInAgentMode = (): void => {
        const activeCellId = notebookTracker.activeCell?.model.id;

        if (!activeCellId || !cellStatesBeforeDiff.current.has(activeCellId)) {
            return;
        }

        rejectSingleCellEdit(
            activeCellId,
            notebookTracker,
            cellStatesBeforeDiff,
            codeDiffStripesCompartments,
            changedCellsRef.current,
            agentTargetNotebookPanelRef || undefined
        );
        updateCellToolbarButtons();
    };

    const acceptAllAICode = (): void => {
        acceptAllCellEdits(
            notebookTracker,
            cellStatesBeforeDiff,
            notebookSnapshotAfterAgentExecutionRef.current,
            codeDiffStripesCompartments
        );
        updateCellToolbarButtons();
    };

    const rejectAllAICode = (): void => {
        rejectAllCellEdits(
            notebookTracker,
            cellStatesBeforeDiff,
            codeDiffStripesCompartments
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

        // Clear and populate the map of original cell states
        cellStatesBeforeDiff.current.clear();

        // Find cells that have changed between snapshots
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
            // Store the original code so we can revert if user rejects
            cellStatesBeforeDiff.current.set(change.cellId, change.originalCode);

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
        cellStatesBeforeDiff.current.clear();
    };

    const setNotebookSnapshotPreAgentExecution = (snapshot: AIOptimizedCell[] | null): void => {
        notebookSnapshotPreAgentExecutionRef.current = snapshot;
    };

    return {
        // State
        cellStatesBeforeDiff,
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
