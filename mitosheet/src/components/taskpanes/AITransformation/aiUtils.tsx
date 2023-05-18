import { GridState, SheetData, UIState } from "../../../types";
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