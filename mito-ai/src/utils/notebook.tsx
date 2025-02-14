import { INotebookTracker } from '@jupyterlab/notebook';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { removeMarkdownCodeFormatting } from './strings';

export const getActiveCell = (notebookTracker: INotebookTracker): Cell | undefined => {
    const notebook = notebookTracker.currentWidget?.content;
    const activeCell = notebook?.activeCell;
    return activeCell || undefined
}

export const getActiveCellID = (notebookTracker: INotebookTracker): string | undefined => {
    return getActiveCell(notebookTracker)?.model.id
}

export const getActiveCellCode = (notebookTracker: INotebookTracker): string | undefined => {
    const activeCell = getActiveCell(notebookTracker)
    return activeCell?.model.sharedModel.source
}

export const getCellCodeByID = (notebookTracker: INotebookTracker, codeCellID: string | undefined): string | undefined => {
    if (codeCellID === undefined) {
        return undefined
    }

    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);
    return cell?.model.sharedModel.source
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

export const didCellExecutionError = (cell: CodeCell): boolean => {
    // TODO: Update to not just the first output. Check them all
    return cell?.model.outputs?.toJSON()[0]?.output_type === "error"
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

