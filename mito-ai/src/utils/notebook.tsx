
import { INotebookTracker } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { formatCodeForCodeCell } from './strings';

export const getActiveCell = (notebookTracker: INotebookTracker): Cell | undefined => {

    const notebook = notebookTracker.currentWidget?.content;
    const activeCell = notebook?.activeCell;
    return activeCell || undefined
}

export const getActiveCellCode = (notebookTracker: INotebookTracker): string | undefined => {
    const activeCell = getActiveCell(notebookTracker)
    return activeCell?.model.sharedModel.source
}

export const writeCodeToActiveCell = (notebookTracker: INotebookTracker, code: string): void =>  {
    const codeMirrorValidCode = formatCodeForCodeCell(code)
    const activeCell = getActiveCell(notebookTracker)
    if (activeCell !== undefined) {
        activeCell.model.sharedModel.source = codeMirrorValidCode 
    }
}

export const getNotebookName = (notebookTracker: INotebookTracker): string => {
    const notebook = notebookTracker.currentWidget?.content;
    return notebook?.title.label || 'Untitled'
}