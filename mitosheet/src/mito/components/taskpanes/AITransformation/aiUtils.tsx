/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { AIRecon, ColumnHeader, GridState, SheetData, UIState } from "../../../types";
import { getDisplayColumnHeader } from "../../../utils/columnHeaders";
import { getColumnHeadersInSelections, getIndexLabelsInSelections } from "../../endo/selectionUtils";
import { AICompletionSelection } from "./AITransformationTaskpane";


export const getSelectionForCompletion = (uiState: UIState, gridState: GridState, sheetDataArray: SheetData[]): AICompletionSelection | undefined => {
    const selectedSheetIndex = uiState.selectedSheetIndex;
    const sheetData = sheetDataArray[selectedSheetIndex];

    if (sheetData === undefined) {
        return undefined;
    }

    const dfName = sheetData.dfName;
    const selectedColumnHeaders = getColumnHeadersInSelections(gridState.selections, sheetData);
    const selectedIndexLabels = getIndexLabelsInSelections(gridState.selections, sheetData);
    

    return {
        'selected_df_name': dfName,
        'selected_column_headers': selectedColumnHeaders,
        'selected_index_labels': selectedIndexLabels
    }
}

const DEFAULT_CHAT_HEIGHT = 30;
const MAX_CHAT_HEIGHT = 100;

export const getChatHeight = (userInput: string, chatInputRef: React.MutableRefObject<HTMLTextAreaElement | null>): number => {

    const chatHeight = DEFAULT_CHAT_HEIGHT + (userInput.split('\n').length - 1) * 14;
    const scrollHeight = chatInputRef.current?.scrollHeight || 0;

    const chatOrScrollMax = Math.max(chatHeight, scrollHeight);
    if (userInput === '' || chatOrScrollMax < DEFAULT_CHAT_HEIGHT) {
        return DEFAULT_CHAT_HEIGHT
    } else if (chatOrScrollMax > MAX_CHAT_HEIGHT) {
        return MAX_CHAT_HEIGHT
    } else {
        return chatOrScrollMax;
    }
}


export const reconIsColumnCreated = (columnHeader: ColumnHeader, dataRecon: AIRecon | undefined, sheetData: SheetData): boolean => {
    const createdColumnHeadersList = dataRecon?.modified_dataframes_recons[sheetData.dfName]?.column_recon.created_columns || []
    const createdDataframesList = dataRecon?.created_dataframe_names || []
    return createdColumnHeadersList.includes(columnHeader) || createdDataframesList.includes(sheetData.dfName)
}

export const reconIsColumnModified = (columnHeader: ColumnHeader, dataRecon: AIRecon | undefined, sheetData: SheetData) => {
    const modifiedColumnHeadersList = Object.values(dataRecon?.modified_dataframes_recons[sheetData.dfName]?.column_recon.modified_columns || {})
    return modifiedColumnHeadersList.includes(getDisplayColumnHeader(columnHeader))
}

export const reconIsColumnRenamed = (columnHeader: ColumnHeader, dataRecon: AIRecon | undefined, sheetData: SheetData) => {
    const renamedColumnHeaderList = Object.values(dataRecon?.modified_dataframes_recons[sheetData.dfName]?.column_recon.renamed_columns || {})
    return renamedColumnHeaderList.includes(getDisplayColumnHeader(columnHeader))
}



    