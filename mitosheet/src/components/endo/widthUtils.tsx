import { DEFAULT_WIDTH } from "./EndoGrid";
import { ColumnID, DataframeID, SheetData, WidthData } from "../../types";
import { sheetIndexToDataframeID } from "../../utils/dataframeID";


export const getWidthDataMap = (selectedDataframeID: DataframeID, sheetDataMap: Record<DataframeID, SheetData>): Record<ColumnID, WidthData> => {
    const widthDataMap: Record<DataframeID, WidthData> = {};
    
    if (Object.keys(sheetDataMap).length === 0) {
        // When sheetDataMap is empty, we create a default widthDataMap so that we avoid 
        // indexing into undefined variables across the codebase.
        // TODO: can we remove this!
        widthDataMap[selectedDataframeID] = getWidthData(undefined);
    } else {
        Object.entries(sheetDataMap).forEach(([dataframeID, sheetData]) => {
            widthDataMap[dataframeID] = getWidthData(sheetData);
        })
    }

    return widthDataMap;
}  


/* 
    A helper function for getting the default widthData
    based on some passed sheet data.

    Optionally, pass defaultWidthData which is a mapping
    from columnID -> width, to set the columns to some
    specific width.
*/
export const getWidthData = (sheetData: SheetData | undefined, defaultWidthData: undefined | Record<ColumnID, number>=undefined): WidthData => {

    if (sheetData === undefined) {
        return {
            widthArray: [],
            widthSumArray: [],
            totalWidth: 0
        }
    }

    const widthArray = new Array<number>(sheetData.numColumns);
    const widthSumArray = new Array<number>(sheetData.numColumns);

    for (let columnIndex = 0; columnIndex < sheetData.numColumns; columnIndex++) {
        const columnID = sheetData.data[columnIndex].columnID;
        let columnWidth = DEFAULT_WIDTH;
        if (defaultWidthData !== undefined) {
            // If the defaultWidthData does not have this columnID stored, then take the default width
            columnWidth = defaultWidthData[columnID] || DEFAULT_WIDTH;
        }

        // NOTE that this is the width after this item!
        widthArray[columnIndex] = columnWidth;
        const previousSum = columnIndex === 0 ? 0 : widthSumArray[columnIndex - 1];
        widthSumArray[columnIndex] = previousSum + columnWidth;
    }

    return {
        widthArray: widthArray,
        widthSumArray: widthSumArray,
        totalWidth: widthArray.reduce((partialSum, width) => partialSum + width, 0)
    }
}

/* 
    A helper function for changing with width of a specific
    column at a specific index.
*/
export const changeColumnWidthDataMap = (dataframeID: DataframeID, widthDataMap: Record<DataframeID, WidthData>, columnIndex: number, newWidth: number): Record<DataframeID, WidthData> => {
    // Update the width array
    const newWidthArray = [...widthDataMap[dataframeID].widthArray];
    newWidthArray[columnIndex] = newWidth;

    const newWidthSumArray = [...widthDataMap[dataframeID].widthSumArray];
    for (let i = columnIndex; i < widthDataMap[dataframeID].widthSumArray.length; i++) {
        let previousSumSaved: number | undefined = newWidthSumArray[i - 1];
        if (previousSumSaved === undefined) {
            previousSumSaved = 0;
        }

        const columnWidth = newWidthArray[i];
        newWidthSumArray[i] = previousSumSaved + columnWidth;
    }

    // And finially the total width
    const newTotalWidth = newWidthArray.reduce((partialSum, width) => partialSum + width, 0); 

    widthDataMap[dataframeID] = {
        widthArray: newWidthArray,
        widthSumArray: newWidthSumArray,
        totalWidth: newTotalWidth
    }

    return widthDataMap;
}

export const reconciliateWidthDataMap = (dataframeID: DataframeID, prevWidthDataArray: Record<DataframeID, WidthData>, columnIDsArray: Record<DataframeID, ColumnID[]>, sheetDataMap: Record<DataframeID, SheetData>): Record<DataframeID, WidthData> => {
    // We make sure that the widthDataArray is defined so that we can index into 
    // it without crashing the sheet. It simplifies the code elsewhere.
    if (Object.keys(sheetDataMap).length === 0) {
        return {dataframeID: getWidthData(undefined)}
    }

    const newColumnWidthsMap: Record<DataframeID, WidthData> = {}
    // TODO: when we move from fake dataframe IDs -> real dataframe ids, (e.g. they
    // are no longer just sheet indexes), we have to update this reconciliate function
    // NOTE: it will become much simpler - it's just matched based on ID.
    for (let i = 0; i < Object.keys(sheetDataMap).length; i++) {
        const columnIDs = columnIDsArray[i];
        const newColumnsWidthsResult = reconciliateWidthData(prevWidthDataArray[i], columnIDs, sheetDataMap[i])
        newColumnWidthsMap[sheetIndexToDataframeID(i)] = newColumnsWidthsResult;
    }

    return newColumnWidthsMap;
}

/* 
    Handles when sheet data changes, potentially reordering, adding, or removing
    columns. 

    Specifically, it makes sure that the column widths are preserved even if the 
    sheet data changes. 

    TODO: this might be a performance hit in the future (but maybe not), so we might
    want to make this more efficient.
*/
export const reconciliateWidthData = (prevWidthData: WidthData | undefined, oldColumnIDsArray: ColumnID[], sheetData: SheetData | undefined): WidthData => {
    // Calculate the old widths of the columns 
    const oldWidths: Record<ColumnID, number> = {};

    // The oldColumnIDsArray can be undefined if the sheet was just added and it is
    // the first time we're updating the gridState. 
    if (prevWidthData !== undefined && oldColumnIDsArray !== undefined) {
        for (let i = 0; i < oldColumnIDsArray.length; i++) {
            oldWidths[oldColumnIDsArray[i]] = prevWidthData.widthArray[i];
        }
    }

    return getWidthData(sheetData, oldWidths);
}