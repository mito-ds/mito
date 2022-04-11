// Utilities for the cell editor

import { FunctionDocumentationObject, functionDocumentationObjects } from "../../data/function_documentation";
import { ColumnHeader, ColumnID, SheetData } from "../../types";
import { getDisplayColumnHeader, isPrimitiveColumnHeader, rowIndexToColumnHeaderLevel } from "../../utils/columnHeaders";
import { getCellDataFromCellIndexes } from "./utils";


/* 
    Given a formula and and optional pending columns that are inserted
    at some location, creates the formula that would result if the user
    accepted these pending selected columns.
*/
export const getFullFormula = (
    formula: string, 
    columnHeader: ColumnHeader,
    pendingSelectedColumns: {
        columnHeaders: (ColumnHeader)[]
        selectionStart: number,
        selectionEnd: number,
    } | undefined
): string => {

    if (pendingSelectedColumns === undefined || pendingSelectedColumns.columnHeaders.length === 0) {
        return formula;
    }

    // Don't suggest the current column
    pendingSelectedColumns.columnHeaders = pendingSelectedColumns.columnHeaders.filter(ch => ch !== columnHeader);

    const columnHeaderString = pendingSelectedColumns.columnHeaders.map(ch => getDisplayColumnHeader(ch)).join(', ');

    const beforeSelection = formula.substring(0, pendingSelectedColumns.selectionStart);
    const afterSelection = formula.substring(pendingSelectedColumns.selectionEnd);
    
    return beforeSelection + columnHeaderString + afterSelection;
}


/**
 * Gets the current selection in the cell editor.
 * 
 * @param containerDiv - the container of the endo grid
 * @returns the selection start and selection end in the cell editor. Defaults to 0 if the editor does not exist
 */
export const getCellEditorInputCurrentSelection = (containerDiv: HTMLDivElement | null): {selectionStart: number, selectionEnd: number} => {

    const cellEditorElement = containerDiv?.querySelector('.cell-editor-input');
    if (cellEditorElement === null) {
        return {
            selectionStart: 0,
            selectionEnd: 0
        };
    } 
    const cellEditorInput = (cellEditorElement as HTMLInputElement);

    return {
        selectionStart: cellEditorInput.selectionStart || 0,
        selectionEnd: cellEditorInput.selectionEnd || 0
    }
}


/**
 * Keys that don't get appended to the cell editing mode when you
 * press them, but still cause the mode to be entered.
 */
const KEYS_TO_ENTER_CELL_EDITING_MODE_EMPTY = [
    'Enter',
    'Backspace'
]
/**
 * Called when cell editing mode is turned on, this gets the starting formula/value for
 * the cell editor that it should initially display. If the row index is -1, then this is 
 * a column header, and we return a string version of the column header
 * 
 * @param sheetData - the data in the endo grid
 * @param startingRowIndex - the place from which the sheet data starts
 * @param rowIndex - the row index of the cell you started editing
 * @param columnIndex - the column index of the cell you started editing
 * @param e - optionally, if cell editing mode is being entered into by a keypress, pass the event here
 * @returns the formula or value that the cell editor should default to
 */
export const getStartingFormula = (sheetData: SheetData | undefined, rowIndex: number, columnIndex: number, e?: KeyboardEvent): string => {
  
    const {columnFormula, cellValue, columnHeader} = getCellDataFromCellIndexes(sheetData, rowIndex, columnIndex);

    let originalValue = '';
    if (rowIndex <= -1) {
        // If this is a column header, let the user start editing with the value they are seeing
        if (columnHeader === undefined) {
            originalValue = ''
        } else if (isPrimitiveColumnHeader(columnHeader)) {
            originalValue = getDisplayColumnHeader(columnHeader)
        } else {
            originalValue = getDisplayColumnHeader(columnHeader[rowIndexToColumnHeaderLevel(columnHeader, rowIndex)]);
        }
    } else if (columnFormula !== undefined && columnFormula !== '') {
        originalValue = columnFormula;
    } else {
        originalValue = cellValue + ''
    }
    
    // If a key is pressed, we overwrite what is currently there with the key, per excel, sheets, and ag-grid
    if (e !== undefined) {
        if (e.key === 'Backspace') {
            // If it's a delete, delete only the last character. We do not delete everything, even though excel 
            // does, because, like ag-grid, we don't support editing by pressing F2
            originalValue = originalValue.substr(0, originalValue.length - 1);
        } else {
            originalValue += (KEYS_TO_ENTER_CELL_EDITING_MODE_EMPTY.includes(e.key) ? '' : e.key);
        }
    }    

    // If the formula is the default formula, we don't display it
    // as it doesn't add anything, and makes it so the arrow keys
    // don't move in the sheet
    if (originalValue === '=0') {
        return '';
    }

    return originalValue;
}

/**
 * Returns true iff the formula ends in a column header in the sheet.
 * 
 * @param formula - the formula to check for ending in a column header
 * @param sheetData - the data returned
 * @returns if the formula ends in a column header in the sheet.
 */
export const formulaEndsInColumnHeader = (formula: string, sheetData: SheetData): boolean => {
    const columnHeaders = sheetData.data.map(c => getDisplayColumnHeader(c.columnHeader));
    // We don't make any suggestions if it starts with a column headers
    const endingColumnHeaders = columnHeaders.filter(columnHeader => formula.toLowerCase().endsWith(columnHeader.toLowerCase()));
    if (endingColumnHeaders.length > 0) {
        return true;
    }
    return false;
}


/**
 * Given a formula being written in a column, suggests some column headers
 * to auto-complete in the formula
 * 
 * @param formula - formula to match against
 * @param columnHeader - column header of the cell being edited
 * @param sheetData - the sheet data in the endo grid
 * @returns - a tuple: the length of the matched end of the formula (the replacement length), and a list of [column header, subtext] suggestions. 
 * The subtext contains the type of the column
 */
export const getSuggestedColumnHeaders = (formula: string, columnID: ColumnID, sheetData: SheetData): [number, [string, string][]] => {
    
    const columnHeadersAndIDs: [string, string][] = sheetData.data.map(c => [c.columnID, getDisplayColumnHeader(c.columnHeader)]);
    const columnHeadersAndIDsWithoutCurrentColumn = columnHeadersAndIDs.filter(([cid,])  => {return cid != columnID});

    // Find the max column header length, and look for column headers matched over this,
    // but don't let it be longer than 50, for performance reasons
    const maxColumnHeaderLength = Math.min(Math.max(...columnHeadersAndIDsWithoutCurrentColumn.map(([, columnHeader]) => columnHeader.length), formula.length), 50);
    
    /* 
        We get various substrings at the end of the formula, and we check them for
        being the start of column headers. However, we also make sure that the character
        directly before the substring is not alphanumric, as this makes less likely we'll
        match a column header in the middle of a string.
    */
    for (let i = maxColumnHeaderLength; i > 0; i--) {
        const substring = formula.substring(formula.length - i).toLowerCase();
        const charBeforeSubstringStarts: string | undefined = formula[formula.length - i - 1];
        if (substring === '' || (charBeforeSubstringStarts && charBeforeSubstringStarts.match(/^[0-9a-z]+$/i))) {
            continue;
        }
        const foundColumns = columnHeadersAndIDsWithoutCurrentColumn.filter(([, columnHeader]) => columnHeader.toLowerCase().startsWith(substring));
        
        // Actually build the suggestions , with subtext that displays the column type
        const suggestedColumnHeaders: [string, string][] = foundColumns.map(([columnID, columnHeader]) => {
            const columnDtype = sheetData.columnDtypeMap[columnID];
            const subtextType = columnDtype === undefined ? 'series' : columnDtype + ' series'; 
            return [columnHeader, `A ${subtextType} in your dataset`];
        });
        if (suggestedColumnHeaders.length > 0) {
            return [substring.length, suggestedColumnHeaders];
        }
    }

    return [0, []];
}


/**
 * Gets suggested functions to autocomplete the formula with. If the formula is empty, 
 * then this function will just return LEFT, DAY, and VALUE.
 * 
 * @param formula - the formula to attempt to autocomplete with a function
 * @param minLength - the minimum length of the function match to look for. As column header suggestions take precedence over the formula suggestions, we limit our search to stop at where the column header was found.
 * @returns - a tuple: the matched length (which becomes the replacement length), a list of [functions, function description] pairs. 
 */
export const getSuggestedFunctions = (formula: string, minLength: number): [number, [string, string][]] => {
    
    // If the formula is empty, suggest some placeholder functions, so that the user knows that 
    // functions exist in the first place
    if (formula.length === 0) {
        // The order they are in is alphabetical, but we rearrange, so that LEFT is first
        const placeholders = functionDocumentationObjects.filter(f => f.function === 'LEFT' || f.function === 'DAY' || f.function === 'VALUE');
        // Rearrrange
        const temp = placeholders[0];
        placeholders[0] = placeholders[1];
        placeholders[1] = temp;


        return [0, placeholders.map(f => {
            return [f.function, f.description] 
        })];
    }

    // Then, we lookup based on the name of the function
    const maxFunctionNameLength = Math.max(...functionDocumentationObjects.map(f => f.function.length));

    for (let i = maxFunctionNameLength; i > minLength - 1; i--) {
        const substring = formula.substring(formula.length - i).toLowerCase();
        const charBeforeSubstringStarts: string | undefined = formula[formula.length - i - 1];
        // As in column header suggestions, if the character directly before the substring is alphanumber,
        // it is likely that this isn't a good string to see if they match the functions
        if (substring === '' || (charBeforeSubstringStarts && charBeforeSubstringStarts.match(/^[0-9a-z]+$/i))) {
            continue;
        }
        const foundFunctionObjects = functionDocumentationObjects.filter(f => {
            // We first check the titles of the function
            if (f.function.toLowerCase().startsWith(substring)) {
                return true;
            } else {
                // We check all the search terms
                for (let i = 0; i < f.search_terms.length; i++) {
                    const searchTerm = f.search_terms[i];
                    if (searchTerm.toLowerCase().startsWith(substring)) {
                        return true
                    }
                }
            }
            return false;
        })
        const suggestedFunctions: [string, string][] = foundFunctionObjects.map(f => {
            return [f.function, f.description]
        });
        if (suggestedFunctions.length > 0) {
            return [substring.length, suggestedFunctions];
        }
    }


    return [0, []];
}

/**
 * Returns the documentation for the function that the user is currently writing, specifically
 * returning documentation for the last function in the formula.
 * 
 * @param formula - the formula the user is currently writing
 */
export const getDocumentationFunction = (formula: string): FunctionDocumentationObject | undefined => {
    
    // Find the final function start
    const finalParenIndex = formula.lastIndexOf('(')
    if (finalParenIndex === -1) {
        return undefined;
    }

    // Loop until we hit a non-function character, building the final function backwards
    let finalFunction = '';
    for (let i = finalParenIndex - 1; i >= 0; i--) {
        const char = formula[i].toLowerCase();
        if (char.match(/^[a-z]+$/i)) {
            finalFunction += char;
        } else {
            break;
        }
    }

    // Reverse the functio so it's in the right order
    finalFunction = finalFunction.split("").reverse().join("").toLowerCase();

    // Return the matching function, if it exists
    const matchingFunctions = functionDocumentationObjects.filter(functionDocumentationObject => functionDocumentationObject.function.toLowerCase() === finalFunction);
    if (matchingFunctions.length !== 1) {
        return undefined;
    } else {
        return matchingFunctions[0];
    }
}