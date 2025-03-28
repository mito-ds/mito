/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { MitoAPI } from "../../api/api";
import { ColumnHeader, ColumnID, EditorState, UIState } from "../../types";
import { getDisplayColumnHeader, isPrimitiveColumnHeader, rowIndexToColumnHeaderLevel } from "../../utils/columnHeaders";
import { TaskpaneType } from "../taskpanes/taskpanes";

export const submitRenameColumnHeader = (
    columnHeader: ColumnHeader,
    finalColumnHeader: ColumnHeader, 
    columnID: ColumnID, 
    sheetIndex: number,
    editorState: EditorState | undefined, 
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    mitoAPI: MitoAPI
): void => {
    // Only submit the formula if it actually has changed
    const newColumnHeader = editorState?.formula || getDisplayColumnHeader(finalColumnHeader);
    const oldColumnHeader = getDisplayColumnHeader(finalColumnHeader);
    if (newColumnHeader !== oldColumnHeader) {
        const levelIndex = isPrimitiveColumnHeader(columnHeader) ? undefined : rowIndexToColumnHeaderLevel(columnHeader, -1);
        void mitoAPI.editRenameColumn(
            sheetIndex,
            columnID,
            newColumnHeader,
            levelIndex
        )

        // Close the taskpane if you do a rename, so that we don't get errors
        // with live updating (e.g. editing a pivot, do a rename, try to edit
        // the same pivot).
        setUIState(prevUIState => {
            if (prevUIState.currOpenTaskpane.type !== TaskpaneType.CONTROL_PANEL) {
                return {
                    ...prevUIState,
                    currOpenTaskpane: { type: TaskpaneType.NONE }
                }
            }
            return prevUIState;
        })
    }
}