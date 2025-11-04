import { NotebookPanel } from '@jupyterlab/notebook';

const MITO_NOTEBOOK_ID = 'mito-notebook-id'

export const setNotebookID = (notebookPanel: NotebookPanel): void => {
    console.log("SET NOTEBOOK ID")
    notebookPanel.model?.setMetadata(MITO_NOTEBOOK_ID, 'test-notebook-id')
}

export const getNotebookID = (notebookPanel: NotebookPanel): string => {
    console.log("GET NOTEBOOK ID")
    console.log(notebookPanel.model?.getMetadata(MITO_NOTEBOOK_ID))
    return notebookPanel.model?.getMetadata(MITO_NOTEBOOK_ID)
}