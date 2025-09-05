/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from "@jupyterlab/notebook";
import { getActiveCellID, getCellByID } from "./notebook";

const INCLUDE_CELL_IN_APP = 'include-cell-in-app';

export const toggleActiveCellIncludeInAppMetadata = (notebookTracker: INotebookTracker): void => {
    const activeCellID = getActiveCellID(notebookTracker);
    toggleIncludeCellInAppMetadata(notebookTracker, activeCellID);
}

export const toggleIncludeCellInAppMetadata = (notebookTracker: INotebookTracker, cellID: string | undefined): void => {

    if (cellID === undefined) {
        return;
    }

    const cell = getCellByID(notebookTracker, cellID);
    if (!cell) {
        return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(cell.model.metadata, INCLUDE_CELL_IN_APP)) {
        const originalVisibility = cell.model.getMetadata(INCLUDE_CELL_IN_APP);
        cell.model.setMetadata(INCLUDE_CELL_IN_APP, !originalVisibility);
    } else {
        // If the metadata doesn't exist yet, that means the user has not yet toggled the visibility.
        // The default value is to show the output, so the first toggle should set the visibiltiy to false.
        cell.model.setMetadata(INCLUDE_CELL_IN_APP, false);
    }
}

export const getActiveCellIncludeInApp = (notebookTracker: INotebookTracker): boolean => {
    const activeCellID = getActiveCellID(notebookTracker);
    return getIncludeCellInApp(notebookTracker, activeCellID);
}

export const getIncludeCellInApp = (notebookTracker: INotebookTracker, cellID: string | undefined): boolean => {
    /* 
    Checks the cell metadata tag to see if the user has marked that this cell should not be included in the app.
    */
    const cell = getCellByID(notebookTracker, cellID);
    if (!cell) {
        return false;
    }

    if (!Object.prototype.hasOwnProperty.call(cell.model.metadata, INCLUDE_CELL_IN_APP)) {
        cell.model.setMetadata(INCLUDE_CELL_IN_APP, true);
    }

    return cell.model.getMetadata(INCLUDE_CELL_IN_APP);
}