/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook"
import { IDocumentManager } from "@jupyterlab/docmanager"
import { getCellIndexByIDInNotebookPanel } from "../../utils/notebook"
import { getCellOutputByIDInNotebook } from "../../utils/cellOutput"
import { logEvent } from "../../restAPI/RestAPI"
import { waitForNotebookReady } from "../../utils/waitForNotebookReady"
import { setNotebookID } from "../../utils/notebookMetadata"

export const getBase64EncodedCellOutput = async (notebookTracker: INotebookTracker, cellID: string | undefined): Promise<string | undefined> => {
    const notebookPanel = notebookTracker.currentWidget
    return getBase64EncodedCellOutputInNotebook(notebookPanel, cellID)
}

export const getBase64EncodedCellOutputInNotebook = async (notebookPanel: NotebookPanel | null, cellID: string | undefined): Promise<string | undefined> => {
    if (cellID === undefined || notebookPanel === null) {
        return undefined
    }

    const cellIndex = getCellIndexByIDInNotebookPanel(notebookPanel, cellID)
    if (cellIndex === undefined) {
        // Log that the cell id is not part of the notebook
        console.log(`Cell with id ${cellID} not found in notebook ${notebookPanel.context.path}`)
        void logEvent('get_cell_output_requested_non_existent_cell')
        return undefined
    } 
    
    const activeCellOutput = await getCellOutputByIDInNotebook(notebookPanel, cellID)
    if (activeCellOutput !== undefined) {
        return activeCellOutput
    } 
    
    return undefined
}

/* 
    Ensure a notebook exists. If no notebook is open, create a new one.
    Returns the notebook panel.
*/
export const ensureNotebookExists = async (
    notebookTracker: INotebookTracker,
    documentManager: IDocumentManager
): Promise<NotebookPanel> => {
    // Check if a notebook already exists
    let notebookPanel = notebookTracker.currentWidget;
    
    if (notebookPanel !== null) {
        return notebookPanel;
    }

    // No notebook exists, create a new one
    try {
        // Create a new notebook model (Contents.IModel has a path property)
        const model = await documentManager.newUntitled({ type: 'notebook' });
        
        // Open the notebook using the path from the model
        await documentManager.open(model.path);
        
        // Wait for the notebook to appear in the tracker and be ready
        await waitForNotebookReady(notebookTracker);
        
        // Get the notebook panel from the tracker
        notebookPanel = notebookTracker.currentWidget;
        
        if (notebookPanel === null) {
            throw new Error('Failed to get notebook panel after creation');
        }

        // Set the notebook ID if it doesn't exist
        setNotebookID(notebookPanel);
        
        return notebookPanel;
    } catch (error) {
        console.error('Error creating new notebook:', error);
        throw error;
    }
};
