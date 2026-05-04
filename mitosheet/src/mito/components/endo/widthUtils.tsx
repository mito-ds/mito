/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { DEFAULT_WIDTH } from "./EndoGrid";
import { ColumnID, GridState, SheetData, WidthData } from "../../types";
import { getCellDataFromCellIndexes } from "./utils";
import { getDisplayColumnHeader } from "../../utils/columnHeaders";

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

    for (let columnIndex = 0; columnIndex < sheetData.data.length; columnIndex++) {
        const column = sheetData.data[columnIndex];
        if (column === undefined) {
            console.warn(`No column data was available for column index ${columnIndex}.`);
            continue;
        }
        const columnID = column.columnID;
        let columnWidth = DEFAULT_WIDTH;
        if (defaultWidthData !== undefined) {
            // If the defaultWidthData does not have this columnID stored, then take the default width
            columnWidth = defaultWidthData[columnID] || DEFAULT_WIDTH;
        }

        // NOTE that this is the width after this item!
        widthArray[columnIndex] = columnWidth;
        const previousSum = columnIndex === 0 ? 0 : widthSumArray[columnIndex - 1] ?? 0;
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
    const currentWidthData = widthDataArray[sheetIndex];
    if (currentWidthData === undefined) {
        console.warn(`No width data was available for sheet index ${sheetIndex}.`);
        return widthDataArray;
    }
    // Update the width array
    const newWidthArray = [...currentWidthData.widthArray];
    newWidthArray[columnIndex] = newWidth;

    const newWidthSumArray = [...currentWidthData.widthSumArray];
    for (let i = columnIndex; i < currentWidthData.widthSumArray.length; i++) {
        let previousSumSaved: number | undefined = newWidthSumArray[i - 1];
        if (previousSumSaved === undefined) {
            previousSumSaved = 0;
        }

        const columnWidth = newWidthArray[i];
        if (columnWidth === undefined) {
            console.warn(`No column width was available for column index ${i}.`);
            continue;
        }
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

export const reconciliateWidthDataArray = (prevWidthDataArray: WidthData[], columnIDsArray: ColumnID[][], sheetDataArray: SheetData[]): WidthData[] => {
    // We make sure that the widthDataArray is defined so that we can index into 
    // it without crashing the sheet. It simplifies the code elsewhere.
    if (sheetDataArray.length === 0) {
        return [getWidthData(undefined)]
    }

    const newColumnWidthsArray: WidthData[] = []
    for (let i = 0; i < sheetDataArray.length; i++) {
        const columnIDs = columnIDsArray[i];
        const sheetData = sheetDataArray[i];
        if (columnIDs === undefined || sheetData === undefined) {
            console.warn(`Missing width reconciliation data for sheet index ${i}.`);
            continue;
        }
        const newColumnsWidthsResult = reconciliateWidthData(prevWidthDataArray[i], columnIDs, sheetData)
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
            const columnID = oldColumnIDsArray[i];
            const width = prevWidthData.widthArray[i];
            if (columnID !== undefined && width !== undefined) {
                oldWidths[columnID] = width;
            }
        }
    }

    return getWidthData(sheetData, oldWidths);
}

/*
    Guess the minimum column width such that the entire column header and each cell is displayed
    completely withour wrapping.

    Returns a number of pixels 
*/
export const guessFullWidthOfColumnHeaderOrContent = (sheetData: SheetData, columnIndex: number, displayColumnHeader: string): number => {
    // Estimate the column header required width as 10px per character and 15px of spacing 
    const displayColumnHeaderPx = displayColumnHeader.length * 10 + 15

    // Estimate the data length as 8px per character in the cell with the longest data
    const column = sheetData.data[columnIndex];
    if (column === undefined) {
        console.warn(`No column data was available for column index ${columnIndex}.`);
        return displayColumnHeaderPx;
    }
    const dataMaxLength = Math.max(...(column.columnData.map(el => String(el).length))) * 8

    // Return the max 
    return Math.max(displayColumnHeaderPx, dataMaxLength)
}


/*
    Guesses the full width for all of the passed column Indexes.
*/
export const getWidthArrayAtFullWidthForColumnIndexes = (columnIndexes: number[], gridState: GridState, sheetData: SheetData): WidthData[]  => {
    let widthDataArray = gridState.widthDataArray
    columnIndexes.forEach(columnIndex => {
        const columnHeader = getCellDataFromCellIndexes(sheetData, -1, columnIndex).columnHeader;

        if (columnHeader === undefined) {
            return
        }

        const displayColumnHeader = getDisplayColumnHeader(columnHeader)

        const fullWidth = guessFullWidthOfColumnHeaderOrContent(sheetData, columnIndex, displayColumnHeader)
        widthDataArray = changeColumnWidthDataArray(gridState.sheetIndex, widthDataArray, columnIndex, fullWidth)
    })
    return widthDataArray
}
