/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState, useEffect, useMemo } from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';

/**
 * Hook that tracks the current cell order in the notebook.
 * Returns a map of cellId → cellNumber (1-indexed).
 * Updates automatically when cells are added, removed, or reordered.
 * 
 * @param notebookTracker - The notebook tracker to monitor
 * @returns A map of cellId to cellNumber (1-indexed)
 */
export const useCellOrder = (notebookTracker: INotebookTracker): Map<string, number> => {
    const [cellOrderKey, setCellOrderKey] = useState(0);

    // Track current widget ID to detect notebook switches
    const currentWidgetId = notebookTracker.currentWidget?.id ?? null;

    // Compute the cell order mapping
    const cellOrder = useMemo(() => {
        const orderMap = new Map<string, number>();
        const notebookPanel = notebookTracker.currentWidget;
        
        if (!notebookPanel) {
            return orderMap;
        }

        const notebook = notebookPanel.content;
        notebook.widgets.forEach((cell, index) => {
            // 1-indexed cell numbers for display
            orderMap.set(cell.model.id, index + 1);
        });

        return orderMap;
    }, [notebookTracker, cellOrderKey, currentWidgetId]);

    // Listen to cell changes to trigger re-computation
    // Include currentWidgetId in dependencies so listener re-attaches when switching notebooks
    useEffect(() => {
        const notebookPanel = notebookTracker.currentWidget;
        if (!notebookPanel) {
            return;
        }

        const notebook = notebookPanel.content;
        
        // Update when cells are added, removed, or reordered
        const handleCellChange = (): void => {
            setCellOrderKey(prev => prev + 1);
        };

        // Listen to cell model changes (fires when cells are added, removed, or reordered)
        notebook.model?.cells.changed.connect(handleCellChange);

        return () => {
            notebook.model?.cells.changed.disconnect(handleCellChange);
        };
    }, [notebookTracker, currentWidgetId]);

    // Also update when the current notebook changes
    useEffect(() => {
        const handleNotebookChange = (): void => {
            setCellOrderKey(prev => prev + 1);
        };

        notebookTracker.currentChanged.connect(handleNotebookChange);
        return () => {
            notebookTracker.currentChanged.disconnect(handleNotebookChange);
        };
    }, [notebookTracker]);

    return cellOrder;
};

