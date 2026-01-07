/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState, useEffect, useCallback } from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';
import { EditorView } from '@codemirror/view';
import { getActiveCell } from '../utils/notebook';
import { useDebouncedFunction } from './useDebouncedFunction';

export interface LineSelectionInfo {
    cellId: string;
    cellNumber: number;  // 1-indexed for display
    startLine: number;   // 0-indexed for backend consistency with citations
    endLine: number;     // 0-indexed for backend consistency with citations
    selectedCode: string;  // The actual selected lines of code
    hasSelection: boolean;
}

const NO_SELECTION: LineSelectionInfo = {
    cellId: '',
    cellNumber: 0,
    startLine: 0,
    endLine: 0,
    selectedCode: '',
    hasSelection: false
};

/**
 * Hook that tracks text selection in the active code cell.
 * Returns selection info when user has text selected (not just cursor position).
 *
 * @param notebookTracker - The notebook tracker to monitor
 * @param cellOrder - Map of cellId to cellNumber (1-indexed)
 * @returns LineSelectionInfo with selection details, or hasSelection: false if no selection
 */
export const useLineSelection = (
    notebookTracker: INotebookTracker,
    cellOrder: Map<string, number>
): LineSelectionInfo => {
    const [selection, setSelection] = useState<LineSelectionInfo>(NO_SELECTION);

    // Debounce selection updates to avoid excessive re-renders during text selection
    // `setSelection` is stable, so this keeps the debounced function stable too.
    const debouncedSetSelection = useDebouncedFunction(setSelection, 100);

    // Get current selection from active cell
    const checkSelection = useCallback(() => {
        const activeCell = getActiveCell(notebookTracker);

        if (!activeCell || activeCell.model.type !== 'code') {
            debouncedSetSelection(NO_SELECTION);
            return;
        }

        const cellId = activeCell.model.id;
        const codeCell = activeCell as CodeCell;
        const cmEditor = codeCell.editor as any;
        const editorView = cmEditor?.editor as EditorView | undefined;

        if (!editorView) {
            debouncedSetSelection(NO_SELECTION);
            return;
        }

        const state = editorView.state;
        const mainSelection = state.selection.main;

        // Check if there's actual text selected (not just cursor)
        if (mainSelection.from === mainSelection.to) {
            debouncedSetSelection(NO_SELECTION);
            return;
        }

        // Get 0-indexed line numbers (matching citation format)
        // CodeMirror's lineAt().number is 1-indexed, so subtract 1
        const startLineInfo = state.doc.lineAt(mainSelection.from);
        const endLineInfo = state.doc.lineAt(mainSelection.to);
        const startLine = startLineInfo.number - 1;
        const endLine = endLineInfo.number - 1;
        const cellNumber = cellOrder.get(cellId) || 0;

        // Extract the full lines that contain the selection
        const selectedLines: string[] = [];
        for (let lineNum = startLineInfo.number; lineNum <= endLineInfo.number; lineNum++) {
            const line = state.doc.line(lineNum);
            selectedLines.push(line.text);
        }
        const selectedCode = selectedLines.join('\n');

        debouncedSetSelection({
            cellId,
            cellNumber,
            startLine,
            endLine,
            selectedCode,
            hasSelection: true
        });
    }, [notebookTracker, cellOrder, debouncedSetSelection]);

    // Poll for selection changes using document-level events
    useEffect(() => {
        // Check selection on various events that might indicate selection change
        const handleSelectionChange = (): void => {
            checkSelection();
        };

        // Listen to selection changes at document level
        document.addEventListener('selectionchange', handleSelectionChange);

        // Also listen to mouseup for drag selections
        document.addEventListener('mouseup', handleSelectionChange);

        // Listen to keyup for keyboard selections (shift+arrow keys)
        document.addEventListener('keyup', handleSelectionChange);

        // Check on active cell change
        const handleActiveCellChanged = (): void => {
            checkSelection();
        };
        notebookTracker.activeCellChanged.connect(handleActiveCellChanged);

        // Initial check
        checkSelection();

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('mouseup', handleSelectionChange);
            document.removeEventListener('keyup', handleSelectionChange);
            notebookTracker.activeCellChanged.disconnect(handleActiveCellChanged);
        };
    }, [notebookTracker, checkSelection]);

    return selection;
};
