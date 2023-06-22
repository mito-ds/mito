import { ColumnHeader, ColumnID, ColumnIDsMap, DisplayColumnHeader, MultiIndexColumnHeader, PrimitiveColumnHeader, SheetData } from "../types";


export const isPrimitiveColumnHeader = (columnHeader: ColumnHeader): columnHeader is PrimitiveColumnHeader => {
    return typeof columnHeader === 'string' || typeof columnHeader === 'number' || typeof columnHeader === 'boolean';
}

/**
 * Given a column header, returns a string that represents how to store this column
 * header on the front-end. 
 * 
 * NOTE: must match the equivalent function in mitosheet/column_headers.py
 * 
 * @param columnHeader The column header to display
 */
export const getDisplayColumnHeader = (columnHeader: ColumnHeader): DisplayColumnHeader => {
    if (isPrimitiveColumnHeader(columnHeader)) {
        return columnHeader.toString()
    } else {
        return columnHeader.map(c => c.toString()).filter(c => c !== '').join(', ')
    }
}

/**
 * 
 * @param columnIDsMap the column header map to turn into a map from column id to display headers
 * @returns a Record of ColumnID to display of a ColumnHeader
 */
export const columnIDMapToDisplayHeadersMap = (columnIDsMap: ColumnIDsMap): Record<ColumnID, DisplayColumnHeader> => {
    return Object.fromEntries(Object.entries(columnIDsMap).map(([columnID, columnHeader]) => {return [columnID, getDisplayColumnHeader(columnHeader)]}));
}

/**
 * When there is a dataframe with multi-index headers, there can also be column headers
 * that just are a single string (e.g. if you add a column using Mito). In this case, we
 * show this column header at the bottom of the column header levels, so this is easy to 
 * read, and so we have a utility for checking when this is the case.
 * 
 * @param columnHeader The column header to check
 */
const isSingleStringMultiIndexHeader = (columnHeader: ColumnHeader): boolean => {
    if (isPrimitiveColumnHeader(columnHeader)) {
        return true;
    }

    for (let i = 1; i < columnHeader.length; i++) {
        if (columnHeader[i] !== '') {
            return false
        } 
    }


    return true;
}

export const getColumnHeaderParts = (columnHeader: ColumnHeader): {lowerLevelColumnHeaders: MultiIndexColumnHeader, finalColumnHeader: PrimitiveColumnHeader} => {
    if (isPrimitiveColumnHeader(columnHeader)) {
        return {
            lowerLevelColumnHeaders: [],
            finalColumnHeader: columnHeader
        }
    } else {
        // First, we check if all elements in the column header except the first are empty strings
        // in which case we just set the single set element a the final column header, and the bunch
        // of empty strings as the lower level headers. This is just a visual trick to make things
        // look consistent and readable
        if (isSingleStringMultiIndexHeader(columnHeader)) {
            return {
                lowerLevelColumnHeaders: columnHeader.slice(1),
                finalColumnHeader: columnHeader[0]
            }
        }

        const lowerLevelColumnHeaders = columnHeader.slice(0, columnHeader.length - 1);
        const finalColumnHeader = columnHeader[columnHeader.length - 1];
        return {
            lowerLevelColumnHeaders: lowerLevelColumnHeaders,
            finalColumnHeader: finalColumnHeader
        }
    }
}

// Converts a row index into the level in the column header
export const rowIndexToColumnHeaderLevel = (columnHeader: MultiIndexColumnHeader, rowIndex: number): number => {
    if (isSingleStringMultiIndexHeader(columnHeader)) {
        return 0;
    }
    return columnHeader.length - (rowIndex * -1)
}



/* 
    Given a list of column headers, returns a formatted string with the first num characters in the column headers
    and the number of column headers that didn't have any character in the first num characters of the list
*/
export const getFirstCharactersOfColumnHeaders = (columnHeaders: ColumnHeader[], num: number): [string, number] => {
    const columnHeadersCopy = [...columnHeaders]
    let charsRemaining = num
    const columnHeadersToDisplay = []
    while (columnHeadersCopy.length > 0 && charsRemaining > 0) {
        const nextFullString = getDisplayColumnHeader(columnHeadersCopy.shift() || '')
        let nextPartialString = ''
        for (let i = 0; i < nextFullString.length; i++) {
            if (charsRemaining > 0) {
                nextPartialString += nextFullString[i];
                charsRemaining--;
            }
        }
        columnHeadersToDisplay.push(nextPartialString)
    }
    return [columnHeadersToDisplay.join(', '), columnHeadersCopy.length]
}

/* 
    Returns a random string of 4 characters used to make new column headers not overlap
*/
export const getNewColumnHeader = (): string => {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export const getColumnIDByIndex = (sheetData: SheetData, columnIndex: number): ColumnID => {
    return Object.keys(sheetData.columnIDsMap)[columnIndex]
}