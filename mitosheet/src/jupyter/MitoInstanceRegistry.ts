/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { MitoAPI } from '../mito/api/api';

/**
 * Represents a single entry in the cross-cell undo stack.
 * Tracks which analysis (cell) performed an edit and when.
 */
export interface UndoEntry {
    analysisName: string;
    stepId: string;
    timestamp: number;
}

/**
 * Represents a registered Mito spreadsheet instance.
 */
interface MitoInstanceEntry {
    analysisName: string;
    mitoAPI: MitoAPI;
    container: HTMLElement;
    lastEditTimestamp: number;
}

/**
 * Global registry of all active Mito spreadsheet instances in a notebook.
 * 
 * This registry enables cross-cell undo by tracking which Mito instance
 * was most recently edited, so that the undo command can target the correct
 * cell regardless of which cell is currently focused.
 */
class MitoInstanceRegistry {
    private instances: Map<string, MitoInstanceEntry> = new Map();
    private undoStack: UndoEntry[] = [];

    /**
     * Register a Mito instance when it mounts.
     */
    register(analysisName: string, mitoAPI: MitoAPI, container: HTMLElement): void {
        this.instances.set(analysisName, {
            analysisName,
            mitoAPI,
            container,
            lastEditTimestamp: 0,
        });
    }

    /**
     * Unregister a Mito instance when it unmounts.
     * Also cleans up any undo stack entries for this instance.
     */
    unregister(analysisName: string): void {
        this.instances.delete(analysisName);
        this.undoStack = this.undoStack.filter(entry => entry.analysisName !== analysisName);
    }

    /**
     * Record that an edit was performed in a specific Mito instance.
     * This pushes an entry onto the cross-cell undo stack and updates
     * the instance's last edit timestamp.
     */
    recordEdit(analysisName: string, stepId?: string): void {
        const instance = this.instances.get(analysisName);
        if (instance) {
            const timestamp = Date.now();
            instance.lastEditTimestamp = timestamp;
            this.undoStack.push({
                analysisName,
                stepId: stepId ?? '',
                timestamp,
            });
        }
    }

    /**
     * Get the Mito instance that was most recently edited.
     * Used by the undo command to target the correct cell.
     */
    getMostRecentlyEdited(): MitoInstanceEntry | undefined {
        if (this.undoStack.length === 0) {
            return undefined;
        }

        // Walk the undo stack from the top to find the most recent entry
        // whose instance is still registered
        for (let i = this.undoStack.length - 1; i >= 0; i--) {
            const entry = this.undoStack[i];
            const instance = this.instances.get(entry.analysisName);
            if (instance) {
                return instance;
            }
        }

        return undefined;
    }

    /**
     * Pop the most recent undo entry from the stack.
     * Called after an undo is successfully performed so that
     * the next undo targets the correct cell.
     */
    popUndoEntry(): UndoEntry | undefined {
        while (this.undoStack.length > 0) {
            const entry = this.undoStack.pop();
            if (entry && this.instances.has(entry.analysisName)) {
                return entry;
            }
        }
        return undefined;
    }

    /**
     * Get a registered instance by analysis name.
     */
    getInstance(analysisName: string): MitoInstanceEntry | undefined {
        return this.instances.get(analysisName);
    }

    /**
     * Get the number of registered instances. Useful for testing.
     */
    getInstanceCount(): number {
        return this.instances.size;
    }

    /**
     * Get the undo stack length. Useful for testing.
     */
    getUndoStackLength(): number {
        return this.undoStack.length;
    }

    /**
     * Clear all instances and undo stack. Useful for testing.
     */
    clear(): void {
        this.instances.clear();
        this.undoStack = [];
    }
}

/**
 * Singleton global registry for all Mito instances in the notebook.
 */
export const globalMitoRegistry = new MitoInstanceRegistry();
