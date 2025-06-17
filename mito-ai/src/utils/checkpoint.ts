/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { ICellMetadata, INotebookMetadata } from '@jupyterlab/nbformat';
import { PartialJSONValue } from '@lumino/coreutils';

export interface INotebookCheckpoint {
    checkpointId: string;
    timestamp: Date;
    notebookPath: string | null;
    cells: ICellCheckpoint[];
    metadata: INotebookMetadata;
}

export interface ICellCheckpoint {
    id: string;
    cellType: 'code' | 'markdown' | 'raw';
    source: string;
    metadata: Partial<ICellMetadata>;
    outputs?: PartialJSONValue[];
    executionCount?: number | null;
}

/**
 * Creates a checkpoint of the entire notebook state
 */
export const createNotebookCheckpoint = (notebookTracker: INotebookTracker): INotebookCheckpoint | null => {
    const currentWidget = notebookTracker.currentWidget;
    if (!currentWidget) {
        console.warn('No active notebook found for checkpoint');
        return null;
    }

    const notebook = currentWidget.content;
    const checkpointId = generateCheckpointId();

    const cells: ICellCheckpoint[] = [];

    // Iterate through all cells and capture their state
    notebook.widgets.forEach((cell: Cell) => {
        const cellModel = cell.model;
        const cellCheckpoint: ICellCheckpoint = {
            id: cellModel.id,
            cellType: cellModel.type as 'code' | 'markdown' | 'raw',
            source: cellModel.sharedModel.getSource(),
            metadata: cellModel.metadata
        };

        // Add code cell specific data
        if (cellModel.type === 'code') {
            const codeModel = cellModel as { outputs?: { toJSON(): PartialJSONValue[] }, executionCount?: number | null };
            cellCheckpoint.outputs = codeModel.outputs ? codeModel.outputs.toJSON() : [];
            cellCheckpoint.executionCount = codeModel.executionCount;
        }

        cells.push(cellCheckpoint);
    });

    const checkpoint: INotebookCheckpoint = {
        checkpointId,
        timestamp: new Date(),
        notebookPath: currentWidget.context.path || null,
        cells,
        metadata: notebook.model?.metadata || {}
    };

    return checkpoint;
};

/**
 * Generates a unique checkpoint ID
 */
const generateCheckpointId = (): string => {
    return `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Simple in-memory storage for the current session
let currentCheckpoint: INotebookCheckpoint | null = null;

/**
 * Saves a checkpoint to storage (currently in-memory for simplicity)
 */
export const saveCheckpoint = (checkpoint: INotebookCheckpoint): void => {
    currentCheckpoint = checkpoint;
    console.log(`💾 Checkpoint saved: ${checkpoint.checkpointId}`);
};

/**
 * Gets the currently stored checkpoint
 */
export const getCurrentCheckpoint = (): INotebookCheckpoint | null => {
    return currentCheckpoint;
};

/**
 * Restores the notebook to the state stored in the checkpoint
 */
export const restoreFromCheckpoint = (notebookTracker: INotebookTracker, checkpoint: INotebookCheckpoint): boolean => {
    const currentWidget = notebookTracker.currentWidget;
    if (!currentWidget) {
        console.warn('No active notebook found for restoration');
        return false;
    }

    const notebook = currentWidget.content;
    const notebookModel = notebook.model;
    if (!notebookModel) {
        console.warn('No notebook model found for restoration');
        return false;
    }

    try {
        console.log(`🔄 Restoring notebook from checkpoint: ${checkpoint.checkpointId}`);

        // Clear all existing cells
        const existingCellCount = notebookModel.cells.length;
        for (let i = existingCellCount - 1; i >= 0; i--) {
            notebookModel.sharedModel.deleteCell(i);
        }

        // Add cells from checkpoint
        checkpoint.cells.forEach((cellCheckpoint, index) => {
            const cellData = {
                cell_type: cellCheckpoint.cellType,
                source: cellCheckpoint.source,
                metadata: cellCheckpoint.metadata || {}
            } as {
                cell_type: 'code' | 'markdown' | 'raw';
                source: string;
                metadata: Partial<ICellMetadata>;
                outputs?: PartialJSONValue[];
                execution_count?: number | null;
            };

            // Add code cell specific data
            if (cellCheckpoint.cellType === 'code') {
                cellData.outputs = cellCheckpoint.outputs || [];
                cellData.execution_count = cellCheckpoint.executionCount;
            }

            notebookModel.sharedModel.insertCell(index, cellData);
        });

        // Update notebook metadata
        if (checkpoint.metadata) {
            Object.entries(checkpoint.metadata).forEach(([key, value]) => {
                if (value !== undefined) {
                    notebookModel.sharedModel.setMetadata(key, value);
                }
            });
        }

        console.log(`✅ Successfully restored ${checkpoint.cells.length} cells from checkpoint`);
        return true;

    } catch (error) {
        console.error('❌ Failed to restore from checkpoint:', error);
        return false;
    }
};

/**
 * Creates and saves a checkpoint in one operation
 */
export const createAndSaveCheckpoint = (notebookTracker: INotebookTracker): INotebookCheckpoint | null => {
    const checkpoint = createNotebookCheckpoint(notebookTracker);
    if (checkpoint) {
        saveCheckpoint(checkpoint);
        return checkpoint;
    }
    return null;
};

/**
 * Restores from the currently stored checkpoint
 */
export const restoreFromCurrentCheckpoint = (notebookTracker: INotebookTracker): boolean => {
    const checkpoint = getCurrentCheckpoint();
    if (!checkpoint) {
        console.warn('No checkpoint available for restoration');
        return false;
    }
    return restoreFromCheckpoint(notebookTracker, checkpoint);
};
