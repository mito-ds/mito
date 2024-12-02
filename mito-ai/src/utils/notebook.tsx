import { INotebookTracker } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { removeMarkdownCodeFormatting } from './strings';

export const getActiveCell = (notebookTracker: INotebookTracker): Cell | undefined => {

    const notebook = notebookTracker.currentWidget?.content;
    const activeCell = notebook?.activeCell;
    return activeCell || undefined
}

export const getActiveCellCode = (notebookTracker: INotebookTracker): string | undefined => {
    console.log("getActiveCellCode__", notebookTracker.currentWidget?.model?.cells)
    const activeCell = getActiveCell(notebookTracker)
    return activeCell?.model.sharedModel.source
}

export const getCellCodeByID = (notebookTracker: INotebookTracker, codeCellID: string): string | undefined => {
    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);
    return cell?.model.sharedModel.source
}

/* 
    Writes code to a cell by ID. 
    If the codeCellID is undefined, it writes to the active cell. 
*/

export const writeCodeToCellByID = (
    notebookTracker: INotebookTracker, 
    code: string | undefined, 
    codeCellID: string | undefined,
    returnFocus?: boolean
): void => {
    if (code === undefined) {
        return;
    }

    if (codeCellID === undefined) {
        // If the codeCellID is undefined, we use the active cell
        codeCellID = getActiveCell(notebookTracker)?.model.id || ''
    }

    const codeMirrorValidCode = removeMarkdownCodeFormatting(code);
    const activeCell = getActiveCell(notebookTracker)
    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);
    
    if (cell) {
        cell.model.sharedModel.source = codeMirrorValidCode;
    }

    // Return focus to the cell if requested
    if (returnFocus && activeCell) {
        activeCell.node.focus()
    }
}

export const getNotebookName = (notebookTracker: INotebookTracker): string => {
    const notebook = notebookTracker.currentWidget?.content;
    return notebook?.title.label || 'Untitled'
}

