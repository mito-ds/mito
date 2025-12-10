/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { UUID } from '@lumino/coreutils';

const MITO_NOTEBOOK_ID_KEY = 'mito-notebook-id'

export const setNotebookID = (notebookPanel: NotebookPanel | null): void => {

    if (notebookPanel === null) {
        return
    }

    const notebookID = getNotebookID(notebookPanel)
    if (notebookID !== undefined) {
        // If there is already a notebook id, then stop early 
        // so we don't overwrite it
        return
    }

    const shortUUID = UUID.uuid4().replace(/-/g, '').slice(0, 12)
    const mitoNotebookID = `mito-notebook-${shortUUID}`
    notebookPanel.model?.setMetadata(MITO_NOTEBOOK_ID_KEY, mitoNotebookID)

    // Finally save the notebook to make sure the metadata sticks
    // This sometimes still does not stick if the kernel is running yet.
    void notebookPanel.context.save();
}

export const getNotebookID = (notebookPanel: NotebookPanel | null): string | undefined => {
    if (notebookPanel === null) {
        return undefined
    }

    return notebookPanel.model?.getMetadata(MITO_NOTEBOOK_ID_KEY)
}

export const getNotebookIDAndSetIfNonexistant = (notebookPanel: NotebookPanel | null): string | undefined => {
    const notebookID = getNotebookID(notebookPanel)

    if (notebookID === undefined) {
        setNotebookID(notebookPanel)
    }

    return getNotebookID(notebookPanel)
}
