/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook"
import { getCellIndexByIDInNotebookPanel } from "../../utils/notebook"
import { getCellOutputByIDInNotebook } from "../../utils/cellOutput"
import { logEvent } from "../../restAPI/RestAPI"

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

export const extractImagesFromContext = (
    additionalContext: Array<{ type: string, value: string }> | undefined,
    metadata: { base64EncodedUploadedImage?: string }
): Array<{ type: string, value: string }> | undefined => {
    // Move any (base64 encoded) images from additionalContext into metadata.
    // The metadata is used on the backend to "attach" the image to the prompt;
    // plus the base64 encoded image is too big to include directly in the prompt.
    additionalContext?.map((context) => {
        if (context.type.startsWith('image/')) {
            metadata.base64EncodedUploadedImage = context.value
        }
    })
    // Remove images from the additionalContext array and return the filtered result.
    return additionalContext?.filter(c => !c.type.startsWith('image/'))
}