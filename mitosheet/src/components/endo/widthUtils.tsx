import { DEFAULT_WIDTH } from "./EndoGrid";
import { ColumnID, DataframeID, SheetData, WidthData } from "../../types";


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
export const changeColumnWidthDataArray = (sheetIndex: number, widthDataArray: WidthData[], columnIndex: number, newWidth: number): WidthData[] => {
    // Update the width array
    const newWidthArray = [...widthDataArray[sheetIndex].widthArray];
    newWidthArray[columnIndex] = newWidth;

    const newWidthSumArray = [...widthDataArray[sheetIndex].widthSumArray];
    for (let i = columnIndex; i < widthDataArray[sheetIndex].widthSumArray.length; i++) {
        let previousSumSaved: number | undefined = newWidthSumArray[i - 1];
        if (previousSumSaved === undefined) {
            previousSumSaved = 0;
        }

        const columnWidth = newWidthArray[i];
        newWidthSumArray[i] = previousSumSaved + columnWidth;
    }

    // And finially the total width
    const newTotalWidth = newWidthArray.reduce((partialSum, width) => partialSum + width, 0); 

    widthDataArray[sheetIndex] = {
        widthArray: newWidthArray,
        widthSumArray: newWidthSumArray,
        totalWidth: newTotalWidth
    }

    return widthDataArray
}

export const reconciliateWidthDataArray = (prevWidthDataArray: WidthData[], columnIDsArray: ColumnID[][], sheetDataMap: Record<DataframeID, SheetData>): WidthData[] => {
    // We make sure that the widthDataArray is defined so that we can index into 
    // it without crashing the sheet. It simplifies the code elsewhere.
    if (Object.keys(sheetDataMap).length === 0) {
        return [getWidthData(undefined)]
    }

    const newColumnWidthsArray: WidthData[] = []
    for (let i = 0; i < Object.keys(sheetDataMap).length; i++) {
        const columnIDs = columnIDsArray[i];
        const newColumnsWidthsResult = reconciliateWidthData(prevWidthDataArray[i], columnIDs, sheetDataMap[i])
        newColumnWidthsArray.push(newColumnsWidthsResult)
    }

    return newColumnWidthsArray
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