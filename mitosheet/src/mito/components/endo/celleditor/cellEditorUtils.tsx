/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Utilities for the cell editor

import { FunctionDocumentationObject, functionDocumentationObjects } from "../../../data/function_documentation";
import { AnalysisData, EditorState, FrontendFormulaAndLocation, IndexLabel, MitoSelection, SheetData } from "../../../types";
import { getDisplayColumnHeader, isPrimitiveColumnHeader, rowIndexToColumnHeaderLevel } from "../../../utils/columnHeaders";
import { getUpperLeftAndBottomRight } from "../selectionUtils";
import { getCellDataFromCellIndexes } from "../utils";

export const getSelectionFormulaString = (selections: MitoSelection[], selectedSheetData: SheetData, editorSheetIndex: number): string => {
    // For each of the selections, we turn them into a string that goes into the formula
    const selectionStrings: string[] = []

    selections.forEach(selection => {
        // For cross-sheet formulas, the sheetData represents the sheet that is currently open,
        // while the editorState.sheetIndex represents the sheet that the formula is being written in.
        // If you're writing to a different sheet from the sheet that is currently open,
        // we need to add the sheet name to the formula
        let dfName = '';
        if (editorSheetIndex !== selection.sheetIndex) {
            dfName = `${selectedSheetData.dfName}!`;
        }
        const [[upperLeftColumnHeader, upperLeftIndexLabel], [bottomRightColumnHeader, bottomRightIndexLabel]] = getUpperLeftAndBottomRight(selection, selectedSheetData);

        if (upperLeftColumnHeader === undefined && upperLeftIndexLabel === undefined && bottomRightColumnHeader === undefined && bottomRightIndexLabel === undefined) {
            // If none are defined, skip this selection
            return;
        } else if (upperLeftIndexLabel === undefined && bottomRightIndexLabel === undefined && (upperLeftColumnHeader !== undefined && bottomRightColumnHeader !== undefined)) {
            // Handle selections that are just column headers
            selectionStrings.push(dfName + getDisplayColumnHeader(upperLeftColumnHeader) + ":" + getDisplayColumnHeader(bottomRightColumnHeader));
        } else if (upperLeftColumnHeader == bottomRightColumnHeader && upperLeftIndexLabel == bottomRightIndexLabel && (upperLeftColumnHeader !== undefined && upperLeftIndexLabel !== undefined)) {
            // Then, we handle the case where there is just a single cell selected
            selectionStrings.push(dfName + getDisplayColumnHeader(upperLeftColumnHeader) + getDisplayColumnHeader(upperLeftIndexLabel));
        } else if (upperLeftColumnHeader !== undefined && upperLeftIndexLabel !== undefined && bottomRightColumnHeader !== undefined && bottomRightIndexLabel !== undefined) {
            // Then, handle the case where they are all defined
            selectionStrings.push(dfName + getDisplayColumnHeader(upperLeftColumnHeader) + getDisplayColumnHeader(upperLeftIndexLabel) + ":" + getDisplayColumnHeader(bottomRightColumnHeader) + getDisplayColumnHeader(bottomRightIndexLabel));
        }
    })

    return selectionStrings.join(', ');
}

/* 
    Given a formula and and optional pending columns that are inserted
    at some location, creates the formula that would result if the user
    accepted these pending selected columns.
*/
export const getFullFormula = (
    editorState: EditorState,
    sheetDataArray: SheetData[],
    selectedSheetIndex: number
): string => {
    const { formula, pendingSelections, sheetIndex } = editorState; 
    if (pendingSelections === undefined || pendingSelections.selections.length === 0) {
        return formula;
    }

    const selectionFormulaString = getSelectionFormulaString(pendingSelections.selections, sheetDataArray[selectedSheetIndex], sheetIndex);

    const beforeSelection = formula.substring(0, pendingSelections.inputSelectionStart);
    const afterSelection = formula.substring(pendingSelections.inputSelectionEnd);
    
    return beforeSelection + selectionFormulaString + afterSelection;
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
 * Gets the editing mode that the cell editor should start in, based on the default.
 */
export const getDefaultEditingMode = (defaultApplyFormulaToColumn: boolean): 'entire_column' | 'specific_index_labels' => {
    return defaultApplyFormulaToColumn ? 'entire_column' : 'specific_index_labels';
}


/**
 * Keys that don't get appended to the cell editing mode when you
 * press them, but still cause the mode to be entered.
 */
const KEYS_TO_ENTER_CELL_EDITING_WITHOUT_CHANGING_FORMULA = [
    'Enter',
    'F2'
]
/**
 * Called when cell editing mode is turned on, this gets the starting formula/value for
 * the cell editor that it should initially display. If the row index is -1, then this is 
 * a column header, and we return a string version of the column header.
 * 
 * Also returns if 
 * 
 * @param sheetData - the data in the endo grid
 * @param startingRowIndex - the place from which the sheet data starts
 * @param rowIndex - the row index of the cell you started editing
 * @param columnIndex - the column index of the cell you started editing
 * @param e - optionally, if cell editing mode is being entered into by a keypress, pass the event here
 * @returns the formula or value that the cell editor should default to
 */
export const getStartingFormula = (
    sheetData: SheetData | undefined, 
    editorState: EditorState | undefined,
    rowIndex: number, 
    columnIndex: number, 
    defaultApplyFormulaToColumn: boolean,
    e?: KeyboardEvent
): {startingColumnFormula: string, arrowKeysScrollInFormula: boolean, editingMode: 'entire_column' | 'specific_index_labels'} => {

    // Preserve the formula if setting the same column's formula and you're just switching cell editors.
    // ie: from the floating cell editor to the formula bar.
    if (editorState !== undefined && editorState.columnIndex === columnIndex) {
        return {
            startingColumnFormula: editorState.formula,
            arrowKeysScrollInFormula: true,
            editingMode: editorState.editingMode
        }
    }
  
    const {columnFormula, columnHeader, columnFormulaLocation} = getCellDataFromCellIndexes(sheetData, rowIndex, columnIndex);

    if (columnHeader === undefined) {
        return {
            startingColumnFormula: '',
            arrowKeysScrollInFormula: false,
            editingMode: getDefaultEditingMode(defaultApplyFormulaToColumn)
        };
    }

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
    } else {
        if (columnFormula === undefined || columnFormula === '') {
            originalValue = '=' + getDisplayColumnHeader(columnHeader);
        } else {
            originalValue = columnFormula;
        }
    }
    
    // If a key is pressed, we overwrite what is currently there with the key, per excel, sheets, and ag-grid
    if (e !== undefined && !KEYS_TO_ENTER_CELL_EDITING_WITHOUT_CHANGING_FORMULA.includes(e.key)) {
        if (e.key === 'Backspace') {
            // If it's a delete, delete only the last character. We do not delete everything, even though excel 
            // does, because, we don't want to encourage single cell editing like this.
            originalValue = originalValue.substr(0, originalValue.length - 1);
        } else {
            originalValue =  e.key;
        }
    }    

    const defaultFormula = `=${getDisplayColumnHeader(columnHeader)}`;

    // If the formula is the default formula, we don't display it
    // as it doesn't add anything, and makes it so the arrow keys
    // don't move in the sheet.
    if (originalValue === defaultFormula) {
        return {
            startingColumnFormula: '',
            arrowKeysScrollInFormula: false,
            editingMode: getDefaultEditingMode(defaultApplyFormulaToColumn)
        }
    }

    return {
        startingColumnFormula: originalValue,
        arrowKeysScrollInFormula: true,
        editingMode: columnFormulaLocation || getDefaultEditingMode(defaultApplyFormulaToColumn)
    };
}

/**
 * Returns true if the formula ends in a refernece to a different column header in the sheet
 * followed by a reference to the row of the index label. 
 */
export const getFormulaEndsInReference = (formula: string, sheetData: SheetData): boolean => {
    const lowercaseFormula = formula.toLowerCase();
    const lowercaseColumnHeaders = sheetData.data.map(c => getDisplayColumnHeader(c.columnHeader).toLowerCase());


    let found = false;
    lowercaseColumnHeaders.forEach(ch => {
        const lastIndexOf = lowercaseFormula.lastIndexOf(ch);
        if (lastIndexOf !== -1) {
            const remainingString = lowercaseFormula.substring(lastIndexOf);
            // Check if this is an index label (TODO: is this performant enough?)
            sheetData.index.forEach(indexLabel => {
                if (remainingString === getDisplayColumnHeader(indexLabel).toLowerCase()) {
                    found = true;
                }
            })
        }
    })

    return found;
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
export const getSuggestedColumnHeaders = (formula: string, sheetData: SheetData): [number, [string, string][]] => {
    
    const columnHeadersAndIDs: [string, string][] = sheetData.data.map(c => [c.columnID, getDisplayColumnHeader(c.columnHeader)]);

    // Find the max column header length, and look for column headers matched over this,
    // but don't let it be longer than 50, for performance reasons
    const maxColumnHeaderLength = Math.min(Math.max(...columnHeadersAndIDs.map(([, columnHeader]) => columnHeader.length), formula.length), 50);
    
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
        const foundColumns = columnHeadersAndIDs.filter(([, columnHeader]) => columnHeader.toLowerCase().startsWith(substring));
        
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
export const getSuggestedFunctions = (formula: string, minLength: number, analysisData: AnalysisData): [number, [string, string][]] => {
    
    // If the formula is empty, suggest some placeholder functions, so that the user knows that 
    // functions exist in the first place
    if (formula.length === 0 || formula === '=') {
        // The order they are in is alphabetical, but we rearrange, so that IF is first
        const placeholders = functionDocumentationObjects.filter(f => f.function === 'IF' || f.function === 'CONCAT' || f.function === 'DAY');
        // Rearrrange
        placeholders.unshift(placeholders[2]);
        delete placeholders[3];

        return [0, placeholders.map(f => {
            return [f.function, f.description] 
        })];
    }

    const allFunctionNamesAndDescription = functionDocumentationObjects.concat(analysisData.userDefinedFunctions).map(f => {
        return {function: f.function, description: f.description, search_terms: f.search_terms}}
    )


    // Then, we lookup based on the name of the function
    const maxFunctionNameLength = Math.max(...allFunctionNamesAndDescription.map(f => f.function.length));

    for (let i = maxFunctionNameLength; i > minLength - 1; i--) {
        const substring = formula.substring(formula.length - i).toLowerCase();
        const charBeforeSubstringStarts: string | undefined = formula[formula.length - i - 1];
        // As in column header suggestions, if the character directly before the substring is alphanumber,
        // it is likely that this isn't a good string to see if they match the functions
        if (substring === '' || (charBeforeSubstringStarts && charBeforeSubstringStarts.match(/^[0-9a-z]+$/i))) {
            continue;
        }
        const foundFunctionObjects = allFunctionNamesAndDescription.filter(f => {
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
 * returning documentation for the last function in the formula that the user has typed.
 */
export const getDocumentationFunction = (formula: string, selectionStart: number | undefined | null, analysisData: AnalysisData): FunctionDocumentationObject | undefined => {
    
    // Find the final function that is before the users selection
    const finalParenIndex = formula.substring(0, selectionStart || undefined).lastIndexOf('(')
    if (finalParenIndex === -1) {
        return undefined;
    }

    // Loop until we hit a non-function character, building the final function backwards
    let finalFunction = '';
    for (let i = finalParenIndex - 1; i >= 0; i--) {
        const char = formula[i].toLowerCase();
        if (char.match(/^[a-z]+$/i) || char === '_') {
            finalFunction += char;
        } else {
            break;
        }
    }

    // Reverse the functio so it's in the right order
    finalFunction = finalFunction.split("").reverse().join("").toLowerCase();

    // Return the matching function, if it exists
    const allFunctionDocumentationObjects = functionDocumentationObjects.concat(analysisData.userDefinedFunctions);
    const matchingFunctions = allFunctionDocumentationObjects.filter(functionDocumentationObject => functionDocumentationObject.function.toLowerCase() === finalFunction);
    
    if (matchingFunctions.length !== 1) {
        return undefined;
    } else {
        return matchingFunctions[0];
    }
}

export const getNewIndexLabelAtRowOffsetFromOtherIndexLabel = (index: IndexLabel[], indexLabel: IndexLabel | undefined, rowOffset: number): IndexLabel | undefined => {
    if (indexLabel === undefined) {
        return undefined;
    }
    
    const indexOfIndexLabel = index.indexOf(indexLabel);
    if (indexOfIndexLabel === -1) {
        return undefined;
    }

    const indexOfNewLabel = indexOfIndexLabel - rowOffset;
    return index[indexOfNewLabel];
}


export const getFormulaStringFromFrontendFormula = (formula: FrontendFormulaAndLocation, indexLabel: IndexLabel | undefined, sheetData: SheetData | undefined): string | undefined => {
    let formulaString = '';
    if (!formula || !sheetData) {
        return formulaString;
    }

    formula.frontend_formula.forEach(formulaPart => {
        if (formulaPart.type === 'string part') {
            formulaString += formulaPart.string
        } else if (formulaPart.type === '{HEADER}') {
            formulaString += formulaPart.display_column_header
        } else if (formulaPart.type == '{SHEET}') {
            formulaString += formulaPart.display_sheet_name
        } else {
            const newIndexLabel = getNewIndexLabelAtRowOffsetFromOtherIndexLabel(formula.index, indexLabel, formulaPart.row_offset);
            if (newIndexLabel !== undefined) {
                formulaString += formulaPart.display_column_header
                formulaString += getDisplayColumnHeader(newIndexLabel);
            } else {
                /**
                 * When have written a formula that references the row before, but now we're editing in the first row,
                 * we get references that reference A-1 (which isn't a thing in the data). In this case, we just display
                 * the constant 0. In all cases other than datetimes, this is what is actually inserted when shifted, so
                 * in practice is the correct thing to show the user. We notably need ot delete the column header
                 */
                formulaString += '0';
            }
        }

    })
    return formulaString;
}