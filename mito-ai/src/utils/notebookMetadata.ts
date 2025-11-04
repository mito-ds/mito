import { NotebookPanel } from '@jupyterlab/notebook';
import { UUID } from '@lumino/coreutils';

const MITO_NOTEBOOK_ID_KEY = 'mito-notebook-id'

export const setNotebookID = (notebookPanel: NotebookPanel | null): void => {

    const notebookID = getNotebookID(notebookPanel)
    if (notebookID !== undefined) {
        // If there is already a notebook id, then stop early 
        // so we don't overwrite it
        return
    }

    // TODO: Generate a shorter UUID
    const mitoNotebookID = `mito-notebook-${UUID.uuid4()}`
    notebookPanel?.model?.setMetadata(MITO_NOTEBOOK_ID_KEY, mitoNotebookID)
}

export const getNotebookID = (notebookPanel: NotebookPanel | null): string | undefined => {
    return notebookPanel?.model?.getMetadata(MITO_NOTEBOOK_ID_KEY)
}