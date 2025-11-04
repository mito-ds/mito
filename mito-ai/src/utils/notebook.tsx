/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker, NotebookActions, NotebookPanel } from '@jupyterlab/notebook';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { removeMarkdownCodeFormatting } from './strings';
import { AIOptimizedCell } from '../websockets/completions/CompletionModels';
import { AgentReviewStatus, ChangedCell } from '../Extensions/AiChat/ChatTaskpane';
import { WindowedList } from '@jupyterlab/ui-components';
import { Compartment, StateEffect } from '@codemirror/state';

export const getActiveCell = (notebookTracker: INotebookTracker): Cell | undefined => {
    const notebookPanel = notebookTracker.currentWidget;
    return getActiveCellInNotebookPanel(notebookPanel)
}

export const getActiveCellInNotebookPanel = (notebookPanel: NotebookPanel | null): Cell | undefined => {
    const activeCell = notebookPanel?.content.activeCell;
    return activeCell || undefined
}

export const getCellByID = (notebookTracker: INotebookTracker, cellID: string | undefined): Cell | undefined => {
    const notebook = notebookTracker.currentWidget
    return getCellByIDInNotebookPanel(notebook, cellID)
}

export const getCellByIDInNotebookPanel = (notebookPanel: NotebookPanel | null, cellID: string | undefined): Cell | undefined => {
    if (cellID === undefined) {
        return undefined
    }

    return notebookPanel?.content.widgets.find(cell => cell.model.id === cellID);
}

export const getActiveCellID = (notebookTracker: INotebookTracker): string | undefined => {
    const notebookPanel = notebookTracker.currentWidget;
    return getActiveCellIDInNotebookPanel(notebookPanel)
}

export const getActiveCellIDInNotebookPanel = (notebookPanel: NotebookPanel | null): string | undefined => {
    return getActiveCellInNotebookPanel(notebookPanel)?.model.id
}

export const getActiveCellCode = (notebookTracker: INotebookTracker): string | undefined => {
    const activeCell = getActiveCell(notebookTracker)
    return activeCell?.model.sharedModel.source
}

export const getCellCodeByID = (notebookTracker: INotebookTracker, codeCellID: string | undefined): string | undefined => {
    const notebookPanel = notebookTracker.currentWidget
    return getCellCodeByIDInNotebookPanel(notebookPanel, codeCellID)
}

export const getCellCodeByIDInNotebookPanel = (notebookPanel: NotebookPanel | null, codeCellID: string | undefined): string | undefined => {
    const cell = getCellByIDInNotebookPanel(notebookPanel, codeCellID)
    return cell?.model.sharedModel.source
}

export const getCellIndexByID = (notebookTracker: INotebookTracker, cellID: string | undefined): number | undefined => {
    const notebookPanel = notebookTracker.currentWidget
    return getCellIndexByIDInNotebookPanel(notebookPanel, cellID)
}

export const getCellIndexByIDInNotebookPanel = (notebookPanel: NotebookPanel | null, cellID: string | undefined): number | undefined => {

    const cellList = notebookPanel?.model?.cells

    if (cellList === undefined) {
        return undefined
    }

    // In order to get the cell index, we need to iterate over the cells and call the `get` method
    // to see the cells in order. Otherwise, the cells are returned in a random order.
    for (let i = 0; i < cellList.length; i++) {
        const cellModel = cellList.get(i)

        if (cellModel.id == cellID) {
            return i
        }
    }

    return undefined
}

export const setActiveCellByID = (notebookTracker: INotebookTracker, cellID: string | undefined): void => {
    const notebookPanel = notebookTracker.currentWidget
    setActiveCellByIDInNotebookPanel(notebookPanel, cellID)
}

export const setActiveCellByIDInNotebookPanel = (notebookPanel: NotebookPanel | null, cellID: string | undefined): void => {
    const cellIndex = getCellIndexByIDInNotebookPanel(notebookPanel, cellID)
    if (cellIndex !== undefined && notebookPanel !== null) {
        notebookPanel.content.activeCellIndex = cellIndex
    }
}

export const writeCodeToCellByID = (
    notebookTracker: INotebookTracker,
    code: string | undefined,
    codeCellID: string,
): void => {
    const notebookPanel = notebookTracker.currentWidget
    writeCodeToCellByIDInNotebookPanel(notebookPanel, code, codeCellID)
}

export const writeCodeToCellByIDInNotebookPanel = (
    notebookPanel: NotebookPanel | null,
    code: string | undefined,
    codeCellID: string | undefined,
): void => {
    if (code === undefined || codeCellID === undefined) {
        return;
    }

    const codeMirrorValidCode = removeMarkdownCodeFormatting(code);
    const notebook = notebookPanel?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);

    if (cell) {
        cell.model.sharedModel.source = codeMirrorValidCode;
    }
}

export const getAIOptimizedCells = (
    notebookTracker: INotebookTracker
): AIOptimizedCell[] => {
    const notebookPanel = notebookTracker.currentWidget
    return getAIOptimizedCellsInNotebookPanel(notebookPanel)
}

export const getAIOptimizedCellsInNotebookPanel = (notebookPanel: NotebookPanel | null): AIOptimizedCell[] => {
    const cellList = notebookPanel?.model?.cells

    if (cellList == undefined || cellList == null) {
        return []
    }

    // In order to get the cell index, we need to iterate over the cells and call the `get` method
    // to see the cells in order. Otherwise, the cells are returned in a random order.
    const cells: AIOptimizedCell[] = []
    for (let i = 0; i < cellList.length; i++) {
        const cellModel = cellList.get(i)

        const cell: AIOptimizedCell = {
            id: cellModel.id,
            cell_type: cellModel.type,
            code: cellModel.sharedModel.source
        }

        cells.push(cell)
    }

    return cells
}

export function createCodeCellAtIndexAndActivate(notebookPanel: NotebookPanel, index: number): void {
    /* 
        Create a new code cell at index and make it the active cell.
    */

    const notebook = notebookPanel.content
    if (notebook === undefined) {
        return;
    }

    if (index > 0) {
        notebook.activeCellIndex = index - 1;

        // insertBelow makes the new cell the active cell
        NotebookActions.insertBelow(notebook);
    } else {
        notebook.activeCellIndex = 0

        // insertAbove makes the new cell the active cell
        NotebookActions.insertAbove(notebook)
    }
}

export const didCellExecutionError = (cell: CodeCell): boolean => {
    /* 
        Check the cell's output for an error.
    */
    const outputs = cell?.model.outputs?.toJSON() || [];
    return outputs.some(output => output.output_type === "error");
}

export const getNotebookName = (notebookTracker: INotebookTracker): string => {
    const notebook = notebookTracker.currentWidget?.content;
    return notebook?.title.label || 'Untitled'
}

export const highlightCodeCell = (notebookTracker: INotebookTracker, codeCellID: string): void => {
    const notebookPanel = notebookTracker.currentWidget;
    if (!notebookPanel) {
        return;
    }
    highlightCodeCellInNotebookPanel(notebookPanel, codeCellID);
}

export const highlightCodeCellInNotebookPanel = (notebookPanel: NotebookPanel, codeCellID: string): void => {
    const cell = notebookPanel?.content.widgets.find(cell => cell.model.id === codeCellID);
    if (cell) {
        const cellElement = cell.node;
        const originalBackground = cellElement.style.background;

        // Add a yellow highlight
        cellElement.style.background = 'var(--purple-400)';

        // Remove highlight after 500ms
        cellElement.style.transition = 'background 0.5s ease';
        setTimeout(() => {
            cellElement.style.background = originalBackground;
        }, 500);
    }
}

export const highlightLinesOfCodeInCodeCell = (
    notebookPanel: NotebookPanel,
    codeCellID: string,
    startLine: number | undefined,
    endLine: number | undefined
): void => {
    /*
        Briefly highlights a range of lines in a code cell, to draw the user's attention to it.

        If no start and end line is provided, then highlight the entire cell.
        
        Args:
            notebookTracker: The notebook tracker.
            codeCellID: The ID of the code cell.
            startLine: The 0-indexed start line number to highlight.
            endLine: The 0-indexed end line number to highlight (inclusive).
    */
    // Get the cell with the given ID
    const cell = getCellByIDInNotebookPanel(notebookPanel, codeCellID);
    if (!cell) {
        return;
    }

    // Get the cell's editor
    const editor = cell.editor;
    if (!editor) {
        return;
    }

    // We expect the line numbers to be 0-indexed. To be safe, if the line numbers are out of bounds, we clamp them.
    const lines = editor.model.sharedModel.source.split('\n');
    const targetStartLine = startLine ? Math.min(Math.max(startLine, 0), lines.length - 1) : 0;
    const targetEndLine = endLine ? Math.min(Math.max(endLine, 0), lines.length - 1) : lines.length - 1;

    // Find the line elements in the DOM
    const cmEditor = cell.node.querySelector('.jp-Editor');
    if (!cmEditor) {
        return;
    }

    // Find all line elements
    const lineElements = cmEditor.querySelectorAll('.cm-line');
    const elementsToHighlight: HTMLElement[] = [];
    const originalBackgrounds: string[] = [];

    // Collect all line elements in the range
    for (let i = targetStartLine; i <= targetEndLine; i++) {
        if (i < lineElements.length) {
            const lineElement = lineElements[i] as HTMLElement;
            if (lineElement) {
                elementsToHighlight.push(lineElement);
                originalBackgrounds.push(lineElement.style.background);
            }
        }
    }

    // Highlight all lines in the range
    elementsToHighlight.forEach(lineElement => {
        lineElement.style.background = 'var(--purple-400)';
        lineElement.style.transition = 'background 0.5s ease';
    });

    // Reset the background colors after a delay
    setTimeout(() => {
        elementsToHighlight.forEach((lineElement, index) => {
            lineElement.style.background = originalBackgrounds[index] || '';
        });
    }, 2000);
}

export const scrollToAndHighlightCell = (
    notebookPanel: NotebookPanel | null,
    cellID: string,
    startLine: number | undefined,
    endLine?: number,
    position: WindowedList.BaseScrollToAlignment = 'center'
): void => {

    if (notebookPanel === null) {
        return;
    }

    // Scroll to the cell
    scrollToCell(notebookPanel, cellID, startLine, position);

    // Wait for the scroll animation to complete before highlighting the lines
    // The default smooth scroll takes about 300-500ms to complete
    setTimeout(() => {

        if (startLine !== undefined) {
            // If no end line was provided, then we just highlight the single line 
            endLine = endLine || startLine;
            highlightLinesOfCodeInCodeCell(notebookPanel, cellID, startLine, endLine);
        } else {
            // If no start line was provided, then we just highlight the entire cell
            highlightLinesOfCodeInCodeCell(notebookPanel, cellID, undefined, undefined);
        }
    }, 500);
}

export const scrollToCell = (
    notebookPanel: NotebookPanel | null,
    cellID: string,
    startLine: number | undefined,
    position: WindowedList.BaseScrollToAlignment = 'center'
): void => {

    // Get the cell
    const cell = getCellByIDInNotebookPanel(notebookPanel, cellID);
    if (!cell || notebookPanel === null) {
        return;
    }

    // If line numbers are provided, figure out what position to scroll to 
    // based on the start line's position in the cell
    const code = getCellCodeByIDInNotebookPanel(notebookPanel, cellID);

    startLine = startLine || 0;
    const relativeLinePosition = startLine / (code?.split('\n').length || 1);

    // These positions must be of type BaseScrollToAlignment defined in @jupyterlab/ui-components
    position = relativeLinePosition < 0.5 ? 'start' : 'end';

    // If the cell is not the active cell, the scrolling does not work. 
    // It scrolls to the cell and then flashes back to the active cell.
    setActiveCellByIDInNotebookPanel(notebookPanel, cellID);

    // Use the new JupyterLab scrollToCell method instead of DOM node scrollIntoView
    void notebookPanel.content.scrollToCell(cell, position);
}

export const scrollToNextCellWithDiff = (
    notebookPanel: NotebookPanel | null,
    currentCellId: string,
    changedCells: ChangedCell[],
    setAgentReviewStatus: (status: AgentReviewStatus) => void,
): void => {
    // Early return if no diffs remain or no notebook panel
    if (changedCells.length === 0 || !notebookPanel) {
        return;
    }

    // Convert changedCells to agentEdits format for internal use
    const agentEdits = changedCells.map(change => ({
        cellId: change.cellId,
        code: change.currentCode
    }));

    // Find current cell's position in the edits list
    const currentEditIndex = agentEdits.findIndex(edit => edit.cellId === currentCellId);
    if (currentEditIndex < 0) {
        return; // Current cell not found in edits
    }

    // First, look for the next cell that still has a diff below the current cell
    let nextCellWithDiff = agentEdits
        .slice(currentEditIndex + 1)
        .find(edit => changedCells.some(change => change.cellId === edit.cellId && !change.reviewed));

    // If no cell found below, go to the first diff in the file
    if (!nextCellWithDiff) {
        nextCellWithDiff = agentEdits
            .find(edit => changedCells.some(change => change.cellId === edit.cellId && !change.reviewed));
    }

    if (!nextCellWithDiff) {
        setAgentReviewStatus('post-agent-code-review');
        return; // No more cells with diffs
    }

    // Scroll to and select the next cell with diff using the notebook panel
    setActiveCellByIDInNotebookPanel(notebookPanel, nextCellWithDiff.cellId);
    scrollToCell(notebookPanel, nextCellWithDiff.cellId, undefined, 'start');
}

export const applyCellEditorExtension = (
    notebookPanel: NotebookPanel,
    cellId: string,
    extension: any,
    compartmentsMap: Map<string, any>
): void => {
    /*
    What it does:
    - Dynamically adds or updates CodeMirror extensions (like visual decorations, custom behaviors, 
      or styling) to individual notebook cells
    - Uses CodeMirror's "compartment" system, which allows extensions to be added, removed, or 
      modified after the editor is already created

    Why we need this:
    - To show visual diff stripes on cells that the AI agent has modified (added/removed/changed lines)
    - To dynamically toggle these decorations on/off (e.g., only show on active cell, remove when 
      user accepts/rejects changes)
    - To avoid recreating the entire editor just to add/remove visual features

    How it works (the compartment pattern):
    - Each cell gets its own compartment (stored in compartmentsMap by cellId)
    - First call: Creates a new compartment and appends the extension to the editor
    - Subsequent calls: Reconfigures the existing compartment with the new extension
    - Pass an empty array as the extension to effectively remove/disable it
    */

    const notebook = notebookPanel.content;
    if (!notebook) return;

    const cell = notebook.widgets.find(c => c.model.id === cellId);
    if (!cell || cell.model.type !== 'code') return;

    const codeCell = cell as CodeCell;
    const cmEditor = codeCell.editor as any; // CodeMirrorEditor
    const editorView = cmEditor?.editor;

    if (!editorView) return;

    let compartment = compartmentsMap.get(cellId);

    if (!compartment) {
        // Create a new compartment if it doesn't exist
        compartment = new Compartment();
        compartmentsMap.set(cellId, compartment);

        editorView.dispatch({
            effects: StateEffect.appendConfig.of(compartment.of(extension)),
        });
    } else {
        // Reconfigure existing compartment
        editorView.dispatch({
            effects: compartment.reconfigure(extension),
        });
    }
}

export const runCellByIDInBackground = async (notebookPanel: NotebookPanel | null, cellId: string): Promise<void> => {
    if (!notebookPanel) return;

    const notebook = notebookPanel.content;
    const sessionContext = notebookPanel.context?.sessionContext;

    // Find the cell by ID
    const cell = notebook.widgets.find(widget => widget.model.id === cellId);
    if (!cell || cell.model.type !== 'code') return;

    // Set the cell as active temporarily
    const originalActiveCellIndex = notebook.activeCellIndex;
    const cellIndex = notebook.widgets.findIndex(widget => widget.model.id === cellId);
    notebook.activeCellIndex = cellIndex;

    try {
        // Run the cell without awaiting - this makes it run in the background
        void NotebookActions.run(notebook, sessionContext);
    } finally {
        // Restore the original active cell
        notebook.activeCellIndex = originalActiveCellIndex;
    }
}