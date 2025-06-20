/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { removeMarkdownCodeFormatting } from './strings';
import { AIOptimizedCell } from '../websockets/completions/CompletionModels';
import { captureNode } from './nodeToPng';
import { WindowedList } from '@jupyterlab/ui-components';

const INCLUDE_CELL_IN_APP = 'include-cell-in-app'

export const getActiveCell = (notebookTracker: INotebookTracker): Cell | undefined => {
    const notebook = notebookTracker.currentWidget?.content;
    const activeCell = notebook?.activeCell;
    return activeCell || undefined
}

export const getCellByID = (notebookTracker: INotebookTracker, cellID: string | undefined): Cell | undefined => {
    if (cellID === undefined) {
        return undefined
    }

    const notebook = notebookTracker.currentWidget?.content;
    return notebook?.widgets.find(cell => cell.model.id === cellID);
}

export const toggleActiveCellIncludeInAppMetadata = (notebookTracker: INotebookTracker): void => {
    const activeCellID = getActiveCellID(notebookTracker);
    toggleIncludeCellInAppMetadata(notebookTracker, activeCellID);
}

export const toggleIncludeCellInAppMetadata = (notebookTracker: INotebookTracker, cellID: string | undefined): void => {

    if (cellID === undefined) {
        return;
    }

    const cell = getCellByID(notebookTracker, cellID);
    if (!cell) {
        return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(cell.model.metadata, INCLUDE_CELL_IN_APP)) {
        const originalVisibility = cell.model.getMetadata(INCLUDE_CELL_IN_APP);
        cell.model.setMetadata(INCLUDE_CELL_IN_APP, !originalVisibility);
    } else {
        // If the metadata doesn't exist yet, that means the user has not yet toggled the visibility.
        // The default value is to show the output, so the first toggle should set the visibiltiy to false.
        cell.model.setMetadata(INCLUDE_CELL_IN_APP, false);
    }
}

export const getActiveCellIncludeInApp = (notebookTracker: INotebookTracker): boolean => {
    const activeCellID = getActiveCellID(notebookTracker);
    return getIncludeCellInApp(notebookTracker, activeCellID);
}

export const getIncludeCellInApp = (notebookTracker: INotebookTracker, cellID: string | undefined): boolean => {
    /* 
    Checks the cell metadata tag to see if the user has marked that this cell should not be included in the app.
    */
    const cell = getCellByID(notebookTracker, cellID);
    if (!cell) {
        return false;
    }

    if (!Object.prototype.hasOwnProperty.call(cell.model.metadata, INCLUDE_CELL_IN_APP)) {
        cell.model.setMetadata(INCLUDE_CELL_IN_APP, true);
    }

    return cell.model.getMetadata(INCLUDE_CELL_IN_APP);
}

export const getActiveCellID = (notebookTracker: INotebookTracker): string | undefined => {
    return getActiveCell(notebookTracker)?.model.id
}

export const getActiveCellCode = (notebookTracker: INotebookTracker): string | undefined => {
    const activeCell = getActiveCell(notebookTracker)
    return activeCell?.model.sharedModel.source
}

export const getCellCodeByID = (notebookTracker: INotebookTracker, codeCellID: string | undefined): string | undefined => {
    const cell = getCellByID(notebookTracker, codeCellID)
    return cell?.model.sharedModel.source
}

export const getActiveCellOutput = async (notebookTracker: INotebookTracker): Promise<string | undefined> => {
    const activeCellID = getActiveCellID(notebookTracker)
    return getCellOutputByID(notebookTracker, activeCellID)
}

export const getCellOutputByID = async (notebookTracker: INotebookTracker, codeCellID: string | undefined): Promise<string | undefined> => {
    if (codeCellID === undefined) {
        return undefined
    }

    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);

    if (cell instanceof CodeCell) {
        const outputNode = cell.outputArea?.node;
        if (outputNode) {
            const image = await captureNode(outputNode);
            return image;
        }
    }
    return undefined
}

export const getCellIndexByID = (notebookTracker: INotebookTracker, cellID: string | undefined): number | undefined => {
    const cellList = notebookTracker.currentWidget?.model?.cells

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
    const cellIndex = getCellIndexByID(notebookTracker, cellID)
    const notebookPanel = notebookTracker.currentWidget
    if (notebookPanel !== undefined && notebookPanel !== null && cellIndex !== undefined) {
        notebookPanel.content.activeCellIndex = cellIndex
    }
}

export const writeCodeToCellByID = (
    notebookTracker: INotebookTracker,
    code: string | undefined,
    codeCellID: string,
): void => {
    if (code === undefined) {
        return;
    }

    const codeMirrorValidCode = removeMarkdownCodeFormatting(code);
    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);

    if (cell) {
        cell.model.sharedModel.source = codeMirrorValidCode;
    }
}

export const getAIOptimizedCells = (
    notebookTracker: INotebookTracker
): AIOptimizedCell[] => {

    const cellList = notebookTracker.currentWidget?.model?.cells

    if (cellList == undefined) {
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

export function createCodeCellAtIndexAndActivate(notebookTracker: INotebookTracker, index: number): void {
    /* 
        Create a new code cell at index and make it the active cell.
    */

    const notebook = notebookTracker.currentWidget?.content
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
    /*
        Briefly highlights a code cell, to draw the user's attention to it.
    */
    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);
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

export const highlightLineOfCodeInCodeCell = (notebookTracker: INotebookTracker, codeCellID: string, lineNumber: number): void => {
    /*
        Briefly highlights a specific line in a code cell, to draw the user's attention to it.
        
        Args:
            notebookTracker: The notebook tracker.
            codeCellID: The ID of the code cell.
            lineNumber: The 0-indexed line number to highlight.
    */
    // Get the cell with the given ID
    const cell = getCellByID(notebookTracker, codeCellID);
    if (!cell) {
        return;
    }

    // Get the cell's editor
    const editor = cell.editor;
    if (!editor) {
        return;
    }

    // We expect the line number to be 0-indexed. To be safe, if the line number is out of bounds, we clamp it.
    const lines = editor.model.sharedModel.source.split('\n');
    const targetLine = Math.min(Math.max(lineNumber, 0), lines.length - 1);

    // Find the line element in the DOM
    const cmEditor = cell.node.querySelector('.jp-Editor');
    if (!cmEditor) {
        return;
    }

    // Find all line elements and get the one at the target index
    const lineElements = cmEditor.querySelectorAll('.cm-line');
    if (targetLine >= lineElements.length) {
        return;
    }

    const lineElement = lineElements[targetLine] as HTMLElement;
    if (!lineElement) {
        return;
    }

    // Store the original background color
    const originalBackground = lineElement.style.background;

    // Change the background color to highlight the line
    lineElement.style.background = 'var(--purple-400)';
    lineElement.style.transition = 'background 0.5s ease';

    // Reset the background color after a delay
    setTimeout(() => {
        lineElement.style.background = originalBackground;
    }, 2000);
}

export const scrollToCell = (
    notebookTracker: INotebookTracker, 
    cellID: string, 
    lineNumber?: number,
    position: WindowedList.BaseScrollToAlignment = 'center'
): void => {

    // Get the cell
    const cell = getCellByID(notebookTracker, cellID);
    if (!cell) {
        return;
    }

    // If a line number is provided, figure out what position to scroll to 
    // in order to display that line by counting the number of lines in the cell.
    // we need to first count the number of lines in the cell.
    if (lineNumber !== undefined) {
        const code = getCellCodeByID(notebookTracker, cellID);
        const relativeLinePosition = lineNumber / (code?.split('\n').length || 1);

        // These positions must be of type BaseScrollToAlignment defined in @jupyterlab/ui-components
        position = relativeLinePosition < 0.5 ? 'start' : 'end';
    }

    // If the cell is not the active cell, the scrolling does not work. 
    // It scrolls to the cell and then flashes back to the active cell.
    setActiveCellByID(notebookTracker, cellID);
  
    void notebookTracker.currentWidget?.content.scrollToCell(cell, position);

    setTimeout(() => {
        if (lineNumber !== undefined) {
            highlightLineOfCodeInCodeCell(notebookTracker, cellID, lineNumber);
        }
    }, 500);
}