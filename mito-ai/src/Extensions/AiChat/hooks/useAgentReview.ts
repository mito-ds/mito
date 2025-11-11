/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useRef } from 'react';
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
    highlightCodeCellInNotebookPanel,
    scrollToCell,
    writeCodeToCellByIDInNotebookPanel
} from '../../../utils/notebook';
import { AgentReviewStatus, ChangedCell } from '../ChatTaskpane';
import { NotebookPanel } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';

export interface AgentReviewChangeCounts {
    added: number;
    modified: number;
    removed: number;
    total: number;
}

interface UseAgentReviewProps {
    app: JupyterFrontEnd;
    agentTargetNotebookPanelRef: React.MutableRefObject<NotebookPanel> | null;
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, any>>;
    updateCellToolbarButtons: () => void;
    setAgentReviewStatus: (status: AgentReviewStatus) => void;
}

export const useAgentReview = ({
    app,
    agentTargetNotebookPanelRef,
    codeDiffStripesCompartments,
    updateCellToolbarButtons,
    setAgentReviewStatus
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
    hasUnreviewedChanges: (cellId: string) => boolean;
    getChangeCounts: () => AgentReviewChangeCounts;
    getReviewProgress: () => { reviewed: number; total: number };
} => {
    // Store a list of changed cells, including their reviewed status.
    const changedCellsRef = useRef<ChangedCell[]>([]);

    // Store notebook snapshots for comparison
    const notebookSnapshotPreAgentExecutionRef = useRef<AIOptimizedCell[] | null>(null);
    const notebookSnapshotAfterAgentExecutionRef = useRef<AIOptimizedCell[] | null>(null);

    // Store change counts (calculated in reviewAgentChanges)
    const changeCountsRef = useRef<AgentReviewChangeCounts>({
        added: 0,
        modified: 0,
        removed: 0,
        total: 0
    });

    const hasUnreviewedChanges = (cellId: string): boolean => {
        return changedCellsRef.current.some(cell => cell.cellId === cellId && !cell.reviewed);
    };

    const getChangeCounts = (): AgentReviewChangeCounts => {
        return changeCountsRef.current;
    };

    const getReviewProgress = (): { reviewed: number; total: number } => {
        const cells = changedCellsRef.current;
        const reviewed = cells.filter(cell => cell.reviewed).length;
        return {
            reviewed,
            total: cells.length
        };
    };

    const acceptAICodeInAgentMode = (): void => {
        const activeCellId = agentTargetNotebookPanelRef?.current?.content.activeCell?.model.id;

        if (!activeCellId || !hasUnreviewedChanges(activeCellId)) {
            return;
        }

        acceptSingleCellEdit(
            activeCellId,
            agentTargetNotebookPanelRef?.current,
            notebookSnapshotAfterAgentExecutionRef.current,
            codeDiffStripesCompartments,
            changedCellsRef.current,
            setAgentReviewStatus,
        );
        updateCellToolbarButtons();
    };

    const rejectAICodeInAgentMode = (): void => {
        const activeCellId = agentTargetNotebookPanelRef?.current?.content.activeCell?.model.id;

        if (!activeCellId || !hasUnreviewedChanges(activeCellId)) {
            return;
        }

        rejectSingleCellEdit(
            activeCellId,
            agentTargetNotebookPanelRef?.current,
            codeDiffStripesCompartments,
            changedCellsRef.current,
            setAgentReviewStatus,
            agentTargetNotebookPanelRef || undefined
        );
        updateCellToolbarButtons();
    };

    const acceptAllAICode = (): void => {
        acceptAllCellEdits(
            agentTargetNotebookPanelRef?.current,
            notebookSnapshotAfterAgentExecutionRef.current,
            codeDiffStripesCompartments,
            changedCellsRef.current
        );
        updateCellToolbarButtons();
    };

    const rejectAllAICode = (): void => {
        rejectAllCellEdits(
            agentTargetNotebookPanelRef?.current,
            codeDiffStripesCompartments,
            changedCellsRef.current
        );
        updateCellToolbarButtons();
    };

    const reviewAgentChanges = (): void => {
        if (!agentTargetNotebookPanelRef?.current) {
            return;
        }

        // Make the notebook panel the active notebook panel
        app.shell.activateById(agentTargetNotebookPanelRef.current.id);

        const currentNotebookSnapshot = getAIOptimizedCellsInNotebookPanel(agentTargetNotebookPanelRef.current);
        notebookSnapshotAfterAgentExecutionRef.current = currentNotebookSnapshot;

        if (!notebookSnapshotPreAgentExecutionRef.current || !currentNotebookSnapshot) {
            return;
        }

        // Clear and populate the changed cells array
        const changedCells: ChangedCell[] = [];
        changedCellsRef.current = changedCells;

        // Initialize counters
        let added = 0;
        let modified = 0;
        let removed = 0;

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
                    modified++;
                }
            } else {
                // Cell was added (doesn't exist in original snapshot)
                changedCells.push({
                    cellId: currentCell.id,
                    originalCode: '',
                    currentCode: currentCell.code,
                    reviewed: false
                });
                added++;
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
                removed++;
            }
        });

        // Update the change counts ref
        changeCountsRef.current = {
            added,
            modified,
            removed,
            total: changedCells.length
        };

        if (changedCells.length === 0) {
            console.log('No changes detected between snapshots');
            return;
        }

        // For each changed cell, calculate and apply diff stripes
        changedCells.forEach(change => {
            // Calculate the code diffs
            const { unifiedCodeString, unifiedDiffs } = getCodeDiffsAndUnifiedCodeString(change.originalCode, change.currentCode);

            // Write the unified code string to the cell
            writeCodeToCellByIDInNotebookPanel(agentTargetNotebookPanelRef.current, unifiedCodeString, change.cellId);

            // Apply diff stripes to this cell
            applyDiffStripesToCell(agentTargetNotebookPanelRef.current, change.cellId, unifiedDiffs, codeDiffStripesCompartments.current);

            // Highlight the cell to draw attention
            highlightCodeCellInNotebookPanel(agentTargetNotebookPanelRef.current, change.cellId);
        });

        // Scroll to the first changed cell
        const firstChangedCell = changedCells[0];
        if (firstChangedCell && agentTargetNotebookPanelRef.current) {
            scrollToCell(agentTargetNotebookPanelRef.current, firstChangedCell.cellId, undefined, 'start');
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
        setNotebookSnapshotPreAgentExecution,
        hasUnreviewedChanges,
        getChangeCounts,
        getReviewProgress
    };
};
