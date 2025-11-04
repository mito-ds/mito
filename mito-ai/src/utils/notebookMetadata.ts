import { NotebookPanel } from '@jupyterlab/notebook';
import { UUID } from '@lumino/coreutils';

const MITO_NOTEBOOK_ID = 'mito-notebook-id'

export const setNotebookID = (notebookPanel: NotebookPanel): void => {
    console.log("SET NOTEBOOK ID")
    const MITO_NOTEBOOK_ID_PREFIX = 'mito-notebook'
    // TODO: Generate a shorter UUID
    const mitoNotebookID = `${MITO_NOTEBOOK_ID_PREFIX}-${UUID.uuid4()}`
    notebookPanel.model?.setMetadata(MITO_NOTEBOOK_ID, mitoNotebookID)
}

export const getNotebookID = (notebookPanel: NotebookPanel): string => {
    console.log("GET NOTEBOOK ID")
    console.log(notebookPanel.model?.getMetadata(MITO_NOTEBOOK_ID))
    return notebookPanel.model?.getMetadata(MITO_NOTEBOOK_ID)
}