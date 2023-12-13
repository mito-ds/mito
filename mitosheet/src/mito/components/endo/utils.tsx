import { Action, ColumnFilters, ColumnFormatType, ColumnHeader, ColumnID, GridState, IndexLabel, SheetData, UIState } from "../../types";
import { isBoolDtype, isDatetimeDtype, isFloatDtype, isIntDtype, isTimedeltaDtype } from "../../utils/dtypes";
import { getKeyboardShortcutString } from "../../utils/keyboardShortcuts";
import StepsIcon from "../icons/StepsIcon";
import { getFormulaStringFromFrontendFormula } from "./celleditor/cellEditorUtils";
import { getWidthData } from "./widthUtils";
import React from 'react';

export const isNumberInRangeInclusive = (num: number, start: number, end: number): boolean => {
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
            endingRowIndex: -1,
            sheetIndex: selectedSheetIndex,
        }],
        copiedSelections: [],
        // When sheetDataArray is empty, we create a default widthDataArray so that we avoid 
        // indexing into undefined variables across the codebase.
        widthDataArray: (sheetDataArray.length === 0) ? [getWidthData(undefined)] : sheetDataArray.map(sheetData => getWidthData(sheetData)),
        columnIDsArray: getColumnIDsArrayFromSheetDataArray(sheetDataArray),
    }
}


// Returns an JSX Element with the type identifier for that type of column
export const getTypeIdentifier = (columnDtype: string): string => {
    // Default to identifying the column as a string if we can't figure out what it is
    let typeText = 'str'
    if (isFloatDtype(columnDtype)) {
        typeText = 'float'
    } else if (isIntDtype(columnDtype)) {
        typeText = 'int'
    } else if (isDatetimeDtype(columnDtype)) {
        typeText = 'date'
    } else if (isTimedeltaDtype(columnDtype)) {
        typeText = 'time'
    } else if (isBoolDtype(columnDtype)) {
        typeText = 'bool'
    }

    return typeText;
}


/**
 * A helper function to get data describing a cell from
 * indexes, in a type safe way.
 */
export const getCellDataFromCellIndexes = (sheetData: SheetData | undefined, rowIndex: number, columnIndex: number): {
    columnID: ColumnID | undefined,
    columnHeader: ColumnHeader | undefined,
    columnDtype: string | undefined,
    columnFormula: string | undefined,
    columnFormulaLocation: 'entire_column' | 'specific_index_labels' | undefined,
    cellValue: string | number | boolean | undefined,
    columnFilters: ColumnFilters | undefined,
    columnFormat: ColumnFormatType | undefined,
    headerBackgroundColor: string | undefined,
    headerTextColor: string | undefined,
    indexLabel: IndexLabel | undefined,
} => {

    
    const columnID: string | undefined = sheetData?.data[columnIndex]?.columnID;
    const columnHeader = sheetData?.data[columnIndex]?.columnHeader;
    const indexLabel = columnID !== undefined ? sheetData?.index[rowIndex] : undefined;
    const columnDtype = columnID !== undefined ? sheetData?.data[columnIndex].columnDtype : undefined;
    const columnFormulaAndLocation = columnID !== undefined ? sheetData !== undefined ? sheetData?.columnFormulasMap[columnID] : [] : [];
    let columnFormula: string | undefined;
    let columnFormulaLocation: 'entire_column' | 'specific_index_labels' | undefined;

    // To find the column formula, we go through and find the LAST formula that was written that is
    // applied to this specific index label. Entire column formulas apply to the everything, duh
    if (columnFormulaAndLocation.length !== 0) {
        columnFormulaAndLocation.forEach(cfal => {
            if (cfal.location.type === 'entire_column') {
                columnFormula = getFormulaStringFromFrontendFormula(cfal, indexLabel, sheetData);
                columnFormulaLocation = 'entire_column';
            } else if (indexLabel !== undefined && cfal.location.index_labels.includes(indexLabel)) {
                columnFormula = getFormulaStringFromFrontendFormula(cfal, indexLabel, sheetData);
                columnFormulaLocation = 'specific_index_labels'
            }
        })
    }

    const columnFilters = columnID !== undefined ? sheetData?.columnFiltersMap[columnID] : undefined;
    const cellValue = columnID !== undefined ? sheetData?.data[columnIndex].columnData[rowIndex] : undefined;
    const columnFormat = columnID !== undefined ? sheetData?.dfFormat.columns[columnID] : undefined;
    const headerBackgroundColor = columnID !== undefined ? sheetData?.dfFormat.headers.backgroundColor : undefined;
    const headerTextColor = columnID !== undefined ? sheetData?.dfFormat.headers.color : undefined;

    return {
        columnID: columnID,
        columnHeader: columnHeader,
        columnFormula: columnFormula,
        columnFormulaLocation: columnFormulaLocation,
        columnDtype: columnDtype,
        columnFilters: columnFilters,
        cellValue: cellValue,
        columnFormat: columnFormat,
        headerBackgroundColor: headerBackgroundColor, 
        headerTextColor: headerTextColor,
        indexLabel: indexLabel
    }
}

/*
    Helper function for creating the ColumnIDsMapping: sheetIndex -> columnIndex -> columnID
    from the Sheet Data Array
*/
export const getColumnIDsArrayFromSheetDataArray = (sheetDataArray: SheetData[]): ColumnID[][] => {
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
export const doesColumnExist = (columnID: ColumnID | undefined, sheetIndex: number, sheetDataArray: SheetData[]): boolean => {
    return columnID !== undefined && sheetDataArray[sheetIndex]?.columnDtypeMap[columnID] !== undefined
}

/* 
    Determines if the sheet contains data
*/
export const doesSheetContainData = (sheetIndex: number, sheetDataArray: SheetData[]): boolean => {
    const sheetData = sheetDataArray[sheetIndex]
    return sheetData !== undefined && sheetData.numRows > 0 && sheetData.numColumns > 0
}

/* 
    Determines if a graphing tab is selected in the sheet
*/
export const getGraphIsSelected = (uiState: UIState): boolean => {
    return uiState.selectedTabType === 'graph' && uiState.selectedGraphID !== undefined;
}

/* 
    Determines if a data tab is selected in the sheet
*/
export const getDataframeIsSelected = (uiState: UIState, sheetDataArray: SheetData[]): boolean => {
    return uiState.selectedTabType === 'data' && sheetDataArray.length !== 0;
}

/** 
 * Returns the props to give to a DropdownItem component, given an Action.
 * Used by the context menus. 
*/
export const getPropsForContextMenuDropdownItem = (action: Action, closeOpenEditingPopups: () => void) => {
    return {
        title: action.titleContextMenu ?? action.titleToolbar ?? action.longTitle,
        tooltip: action.isDisabled() ?? action.tooltip,
        onClick: () => {
            closeOpenEditingPopups();
            void action.actionFunction();
        },
        disabled: !!action.isDisabled(),
        icon: action.iconContextMenu ? <action.iconContextMenu /> : action.iconToolbar ? <action.iconToolbar/> : <StepsIcon/>,
        rightText: getKeyboardShortcutString(action),
    }
}