/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useRef, useEffect, useCallback } from 'react';
import { NotebookActions } from '@jupyterlab/notebook';
import { ChartWizardData } from '../ChartWizardPlugin';
import { writeCodeToCellByIDInNotebookPanel } from '../../../utils/notebook';

interface UseDebouncedNotebookUpdateProps {
    chartData: ChartWizardData | null;
    debounceDelay?: number;
}

interface UseDebouncedNotebookUpdateReturn {
    updateNotebookCell: (updatedCode: string) => void;
    scheduleUpdate: (updatedCode: string) => void;
    clearPendingUpdate: () => void;
}

/**
 * Hook to manage debounced notebook cell updates.
 * 
 * Provides:
 * - updateNotebookCell: Function to update and re-execute notebook cell with debouncing
 * - clearPendingUpdate: Function to clear any pending debounced updates
 */
export const useDebouncedNotebookUpdate = ({
    chartData,
    debounceDelay = 500,
}: UseDebouncedNotebookUpdateProps): UseDebouncedNotebookUpdateReturn => {
    const executeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (executeTimeoutRef.current) {
                clearTimeout(executeTimeoutRef.current);
            }
        };
    }, []);

    const updateNotebookCell = useCallback(
        (updatedCode: string): void => {
            if (!chartData) return;

            const notebookPanel = chartData.notebookTracker.currentWidget;
            if (!notebookPanel) return;

            // Update the cell code
            writeCodeToCellByIDInNotebookPanel(notebookPanel, updatedCode, chartData.cellId);

            // Re-execute the cell to show updated chart
            const notebook = notebookPanel.content;
            const sessionContext = notebookPanel.context?.sessionContext;
            void NotebookActions.run(notebook, sessionContext);
        },
        [chartData]
    );

    const scheduleUpdate = useCallback(
        (updatedCode: string): void => {
            // Clear previous timeout
            if (executeTimeoutRef.current) {
                clearTimeout(executeTimeoutRef.current);
            }

            // Debounce the cell update and execution
            executeTimeoutRef.current = setTimeout(() => {
                updateNotebookCell(updatedCode);
            }, debounceDelay);
        },
        [updateNotebookCell, debounceDelay]
    );

    const clearPendingUpdate = useCallback((): void => {
        if (executeTimeoutRef.current) {
            clearTimeout(executeTimeoutRef.current);
            executeTimeoutRef.current = null;
        }
    }, []);

    return {
        updateNotebookCell,
        scheduleUpdate,
        clearPendingUpdate,
    };
};
