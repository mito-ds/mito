/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from "@jupyterlab/notebook"
import { getActiveCellOutput, getCellIndexByID, scrollToCell } from "../../utils/notebook"
import { logEvent } from "../../restAPI/RestAPI"


export const getBase64EncodedCellOutput = async (notebookTracker: INotebookTracker, cellID: string | undefined): Promise<string | undefined> => {
    if (cellID === undefined) {
        return undefined
    }

    // Check if the cell id is part of the notebook
    const cellIndex = getCellIndexByID(notebookTracker, cellID)
    
    if (cellIndex === undefined) {
        // Log that the cell id is not part of the notebook
        console.log(`Cell with id ${cellID} not found in notebook`)
        void logEvent('get_cell_output_requested_non_existent_cell')
        return undefined
    } 

    scrollToCell(notebookTracker, cellID, 0)
    
    const activeCellOutput = await getActiveCellOutput(notebookTracker)
    if (activeCellOutput !== undefined) {
        return activeCellOutput
    } 
    
    return undefined
}