/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook"
import { getCellIndexByIDInNotebookPanel, getCellOutputByIDInNotebook } from "../../utils/notebook"
import { logEvent } from "../../restAPI/RestAPI"

export const getBase64EncodedCellOutput = async (notebookTracker: INotebookTracker, cellID: string | undefined): Promise<string | undefined> => {
    const notebookPanel = notebookTracker.currentWidget
    return getBase64EncodedCellOutputInNotebook(notebookPanel, cellID)
}

export const getBase64EncodedCellOutputInNotebook = async (notebookPanel: NotebookPanel | null, cellID: string | undefined): Promise<string | undefined> => {
    console.log("HERE!!!")
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
        console.log('activeCellOutput', activeCellOutput)
        return activeCellOutput
    } 

    console.log('activeCellOutput', activeCellOutput)
    
    return undefined
}