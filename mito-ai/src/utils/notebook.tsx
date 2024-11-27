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
    Writes code to the active cell in the notebook. If the code is undefined, it does nothing.
*/
export const writeCodeToActiveCell = (notebookTracker: INotebookTracker, code: string | undefined, focus?: boolean): void =>  {
    if (code === undefined) {
        return
    }
    
    const codeMirrorValidCode = removeMarkdownCodeFormatting(code)
    const activeCell = getActiveCell(notebookTracker)
    if (activeCell !== undefined) {
        activeCell.model.sharedModel.source = codeMirrorValidCode

        if (focus) {
            activeCell.node.focus()
        }
    }
}

export const writeCodeToCellByID = (
    notebookTracker: INotebookTracker, 
    code: string | undefined, 
    codeCellID: string,
    returnFocus?: boolean
): void => {
    if (code === undefined) {
        return;
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

