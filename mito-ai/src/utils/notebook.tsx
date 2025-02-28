import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { removeMarkdownCodeFormatting } from './strings';
import { AIOptimizedCell } from './websocket/models';

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

export const setActiveCellByID = (notebookTracker: INotebookTracker, cellID: string | undefined) => {
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

    console.log(cells)

    return cells
}

export function createCodeCellAtIndex(notebookTracker: INotebookTracker, index: number): string | undefined {
    /* 
        Create a new code cell at index and make it the active cell.
        Returns the new cell's id
    */

    const notebook = notebookTracker.currentWidget?.content
    if (notebook === undefined) {
        return undefined;
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

    return notebookTracker.activeCell?.id
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

export const highlightCodeCell = (notebookTracker: INotebookTracker, codeCellID: string) => {
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

