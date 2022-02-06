import React from "react";
import BooleanTypeIcon from "../icons/columntypes/BooleanTypeIcon";
import NumberTypeIcon from "../icons/columntypes/NumberTypeIcon";
import StringTypeIcon from "../icons/columntypes/StringTypeIcon";
import TimedeltaTypeIcon from "../icons/columntypes/TimedeltaTypeIcon";
import DatetimeTypeIcon from "../icons/columntypes/DatetimeTypeIcon";
import { ColumnFilters, ColumnHeader, ColumnMitoType, GridState, SheetData } from "../../types";
import { getWidthData } from "./widthUtils";


export const isNumberInRangeInclusive = (num: number, start: number, end: number): boolean =>  {
    return start <= num && num <= end;
}

/* 
    A helper function for getting the first non-null or undefined
    value from a list of arguments.

    NOTE: May cause issues with all null or undefined values
*/
export function firstNonNullOrUndefined<T>(...args: (T | null | undefined)[]): T {
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg !== null && arg !== undefined) {
            return arg;
        }
    }

    // NOTE: make sure one of the options is null or undefined
    return args[0] as T;
}


/**
 * Get the grid state of a sheet that was just rendered/switched to.
 */
export const getDefaultGridState = (sheetDataArray: SheetData[], selectedSheetIndex: number): GridState => {

    return {
        sheetIndex: selectedSheetIndex,
        viewport: {
            width: 0,
            height: 0,
        },
        scrollPosition: {
            scrollLeft: 0,
            scrollTop: 0
        },
        selections: [{
            startingColumnIndex: 0,
            endingColumnIndex: 0,
            startingRowIndex: -1,
            endingRowIndex: -1
        }],
        // When sheetDataArray is empty, we create a default widthDataArray so that we avoid 
        // indexing into undefined variables across the codebase.
        widthDataArray: (sheetDataArray.length === 0) ? [getWidthData(undefined)] : sheetDataArray.map(sheetData => getWidthData(sheetData)),
        columnIDsArray: getColumnIDsArrayFromSheetDataArray(sheetDataArray),
        searchString: ''
    }
}


// Returns an icon for that type of column
export const getTypeIcon = (mitoType: ColumnMitoType, purpleOrDark?: 'purple' | 'dark'): JSX.Element => {
    if (mitoType === ColumnMitoType.STRING_SERIES) {
        return <StringTypeIcon purpleOrDark={purpleOrDark}/>
    } else if (mitoType === ColumnMitoType.NUMBER_SERIES ) {
        return <NumberTypeIcon purpleOrDark={purpleOrDark}/>
    } else if (mitoType === ColumnMitoType.DATETIME_SERIES) {
        return <DatetimeTypeIcon purpleOrDark={purpleOrDark}/>
    } else if (mitoType === ColumnMitoType.TIMEDELTA_SERIES ) {
        return <TimedeltaTypeIcon purpleOrDark={purpleOrDark}/>
    } else if (mitoType === ColumnMitoType.BOOLEAN_SERIES ) {
        return <BooleanTypeIcon purpleOrDark={purpleOrDark}/>
    } else {
        // If we can't identify the column, mark it as an object
        return <StringTypeIcon purpleOrDark={purpleOrDark}/>
    }
}


/**
 * A helper function to get data describing a cell from
 * indexes, in a type safe way.
 */
export const getCellDataFromCellIndexes = (sheetData: SheetData | undefined, rowIndex: number, columnIndex: number): {
    columnID: string | undefined,
    columnHeader: ColumnHeader | undefined,
    columnDtype: string | undefined,
    columnFormula: string | undefined,
    columnMitoType: ColumnMitoType | undefined,
    cellValue: string | number | boolean | undefined,
    columnFilters: ColumnFilters | undefined,
} => {
    const columnID: string | undefined = sheetData?.data[columnIndex]?.columnID;
    const columnHeader = sheetData?.data[columnIndex]?.columnHeader;
    const columnFormula = columnID !== undefined ? sheetData?.columnSpreadsheetCodeMap[columnID] : undefined;
    const columnMitoType = columnID !== undefined ? sheetData?.columnMitoTypeMap[columnID] : undefined;
    const columnDtype = columnID !== undefined ? sheetData?.data[columnIndex].columnDtype : undefined;
    const columnFilters = columnID !== undefined ? sheetData?.columnFiltersMap[columnID] : undefined;
    const cellValue = columnID !== undefined ? sheetData?.data[columnIndex].columnData[rowIndex] : undefined;

    return {
        columnID: columnID,
        columnHeader: columnHeader,
        columnFormula: columnFormula,
        columnMitoType: columnMitoType,
        columnDtype: columnDtype,
        columnFilters: columnFilters,
        cellValue: cellValue,
    }

}

/*
    Helper function for creating the ColumnIDsMapping: sheetIndex -> columnIndex -> columnID
    from the Sheet Data Array
*/
export const getColumnIDsArrayFromSheetDataArray = (sheetDataArray: SheetData[]): string[][] => {
    return sheetDataArray.map(sheetData => sheetData.data.map(c => c.columnID)) || []
}


export const cellInSearch = (cellValue: string | number | boolean, searchString: string): boolean => {
    if (searchString === '') {
        return false;
    }

    return ('' + cellValue).toLowerCase().search(searchString.toLowerCase()) > -1;
}

/*
    Determines if any sheet exists. Returns True if a sheet exists.
*/
export const doesAnySheetExist = (sheetDataArray: SheetData[]): boolean => {
    return sheetDataArray.length !== 0 
}

/*
    Determines if a columnID exists in a specific sheet. Returns True
*/
export const doesColumnExist = (columnID: string | undefined, sheetIndex: number, sheetDataArray: SheetData[]): boolean => {
    return columnID !== undefined && sheetDataArray[sheetIndex]?.columnMitoTypeMap[columnID] !== undefined
}

/* 
    Determines if the sheet contains data
*/
export const doesSheetContainData = (sheetIndex: number, sheetDataArray: SheetData[]): boolean => {
    const sheetData = sheetDataArray[sheetIndex]
    return sheetData !== undefined && sheetData.numRows > 0 && sheetData.numColumns > 0
}

