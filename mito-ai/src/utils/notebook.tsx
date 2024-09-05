
import { INotebookTracker } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { formatCodeForCodeCell } from './strings';
import { CodeMirrorEditor } from '@jupyterlab/codemirror'; // Add this import


export const getActiveCell = (notebookTracker: INotebookTracker): Cell | undefined => {
    const notebook = notebookTracker.currentWidget?.content;
    const activeCell = notebook?.activeCell;
    return activeCell || undefined
}

export const getActiveCellCode = (notebookTracker: INotebookTracker): string | undefined => {
    const activeCell = getActiveCell(notebookTracker)
    return activeCell?.model.sharedModel.source
}

export const getActiveCellEditor = (notebookTracker: INotebookTracker): CodeMirrorEditor | undefined => {
    const activeCell = getActiveCell(notebookTracker)
    return activeCell?.editor as CodeMirrorEditor | undefined; // Cast to CodeMirrorEditor
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

