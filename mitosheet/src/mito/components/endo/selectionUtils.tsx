/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { BorderStyle, ColumnHeader, ColumnID, IndexLabel, MitoSelection, SheetData } from '../../types';
import { isNumberDtype } from '../../utils/dtypes';
import { MAX_ROWS } from './EndoGrid';


/**
 * Returns true if the given rowIndex and columnIndex are in at least one of the the selections
 * 
 * @param selections - The selections to check in.
 * @param rowIndex - The row index of the cell that may be selected. Could be -1, if this is a column header.
 * @param columnIndex - The column index of the cell that may be selected. Could be -1, if this is a index header.
 */
export const getIsCellSelected = (selections: MitoSelection[], rowIndex: number, columnIndex: number): boolean => {
    let isSelected = false
    selections.forEach(selection => {
        isSelected = isSelected || getIsCellInSingleSelection(selection, rowIndex, columnIndex)
    })
    return isSelected
}

/**
 * Returns true if the given rowIndex and columnIndex are in the selection
 * 
 * @param selection - The selection to check in.
 * @param rowIndex - The row index of the cell that may be selected. Could be -1, if this is a column header.
 * @param columnIndex - The column index of the cell that may be selected. Could be -1, if this is a index header.
 */
export const getIsCellInSingleSelection = (selection: MitoSelection, rowIndex: number, columnIndex: number): boolean => {
    
    // Take special care, as the starting and ending indexes may be bigger or smaller than each other
    const lowerRowIndex = selection.startingRowIndex < selection.endingRowIndex ? selection.startingRowIndex : selection.endingRowIndex;
    const higherRowIndex = selection.startingRowIndex > selection.endingRowIndex ? selection.startingRowIndex : selection.endingRowIndex;
    const rowSelected = lowerRowIndex <= rowIndex && rowIndex <= higherRowIndex;
    
    const lowerColumnIndex = selection.startingColumnIndex < selection.endingColumnIndex ? selection.startingColumnIndex : selection.endingColumnIndex;
    const higherColumnIndex = selection.startingColumnIndex > selection.endingColumnIndex ? selection.startingColumnIndex : selection.endingColumnIndex;
    const columnSelected = lowerColumnIndex <= columnIndex && columnIndex <= higherColumnIndex;

    // If both the row and column are selected, then this is selected
    if (rowSelected && columnSelected) {
        return true;
    }

    if (lowerRowIndex <= -1 && higherRowIndex <= -1) {
        // If only the column header is selected, then we select the entire column
        return columnSelected;
    }
    if (lowerColumnIndex <= -1 && higherColumnIndex <= -1) {
        // If only the index header is selected, then the entire row is
        return rowSelected;
    }

    return false;
}

export const getIsHeader = (rowIndex: number, columnIndex: number): boolean => {
    return rowIndex <= -1 || columnIndex <= -1;
}

export const getCellHTMLElement = (containerDiv: HTMLDivElement | null, rowIndex: number, columnIndex: number): HTMLElement | undefined => {
    if (containerDiv === null) {
        return undefined;
    }
    const cellNode = containerDiv.querySelector(`[mito-row-index="${rowIndex}"][mito-col-index="${columnIndex}"]`);

    if (cellNode === null) {
        return undefined;
    }
    return cellNode as HTMLDivElement;
}

export const getIndexesFromXAndY = (clientX: number, clientY: number): {rowIndex: number | undefined, columnIndex: number | undefined} => {
    let element = document.elementFromPoint(clientX, clientY);
    let rowIndex = undefined;
    let columnIndex = undefined;

    // Loop up parents till we find some indexes, or there are no parents
    while (element) {
        const rowIndexAttribute = element?.getAttribute('mito-row-index');
        rowIndex = rowIndex !== undefined ? rowIndex : (typeof rowIndexAttribute === 'string' ? parseInt(rowIndexAttribute) : undefined); 
        
        const columnIndexAttribute = element?.getAttribute('mito-col-index');
        columnIndex = columnIndex !== undefined ? columnIndex :  (typeof columnIndexAttribute === 'string' ? parseInt(columnIndexAttribute) : undefined); 

        if (rowIndex !== undefined && columnIndex !== undefined) {
            return {
                rowIndex: rowIndex,
                columnIndex: columnIndex,
            }
        }

        element = element.parentElement;
    }
    return {
        rowIndex: rowIndex,
        columnIndex: columnIndex,
    }
}


export const getIndexesFromMouseEvent = (e: React.MouseEvent<HTMLDivElement, MouseEvent> | MouseEvent): {rowIndex: number | undefined, columnIndex: number | undefined} => {
    return getIndexesFromXAndY(e.clientX, e.clientY);

}


export const getNewSelectionAfterMouseUp = (selection: MitoSelection, rowIndex: number | undefined, columnIndex: number | undefined): MitoSelection => {
    // We don't change the selection if either is undefined
    if (rowIndex === undefined || columnIndex === undefined) {
        return selection;
    }

    return {
        startingRowIndex: selection.startingRowIndex,
        endingRowIndex: rowIndex,
        startingColumnIndex: selection.startingColumnIndex,
        endingColumnIndex: columnIndex,
        sheetIndex: selection.sheetIndex
    }
}

/* 
    Returns true if the given key is a navigation key!
*/
export const isNavigationKeyPressed = (key: string): boolean => {
    const arrowUp = key === 'Up' || key === 'ArrowUp';
    const arrowDown = key === 'Down' || key === 'ArrowDown';
    const arrowLeft = key === 'Left' || key === 'ArrowLeft';
    const arrowRight = key === 'Right' || key === 'ArrowRight';
    const tabPressed = key === 'Tab';

    return arrowUp || arrowDown || arrowLeft || arrowRight || tabPressed;
}


/* 
    If a user presses an arrow key, then we move the selection. This new selection
    respects a few constraints:
    1.  It will not be out of bounds for a valid selection.
    2.  If the user is pressing the shift key when the press the arrow key, then
        the selection will be expanded in that direction
    3.  If the user presses the `metaKey` (e.g. command on Mac), then the selection
        jumps to the end of the selectable range. 
    4.  If the user is using the tab key to naviate, the metaKey will not work, and
        shift just reverses the direction tab moves.

    Notably, if the `metaKey` is pressed, and the column or index headers are jumped 
    towards, the selection will stop at the end of the grid before the headers first.
*/
export const getNewSelectionAfterKeyPress = (selection: MitoSelection, e: KeyboardEvent | React.KeyboardEvent, sheetData: SheetData | undefined): MitoSelection => {
    
    // If the user is not moving the selection, we don't change the selection
    if (!isNavigationKeyPressed(e.key)) {
        return selection;
    }

    // Get the navigation keys
    const arrowUp = e.key === 'Up' || e.key === 'ArrowUp';
    const arrowDown = e.key === 'Down' || e.key === 'ArrowDown';
    const arrowLeft = e.key === 'Left' || e.key === 'ArrowLeft';
    const arrowRight = e.key === 'Right' || e.key === 'ArrowRight';
    const tabPressed = e.key === 'Tab';

    const shiftPressed = e.shiftKey; 
    const metaKeyPressed = e.metaKey;
    const altPressed = e.altKey;

    // Do this all inside a selection callback, so it gets ordered correctly
    let startingRowIndex = selection.startingRowIndex;
    let endingRowIndex = selection.endingRowIndex;
    let startingColumnIndex = selection.startingColumnIndex;
    let endingColumnIndex = selection.endingColumnIndex;

    // As we have at most MAX_ROWS rows in the sheet, don't go beyond that
    const numRows = Math.min(sheetData?.numRows || 0, MAX_ROWS);
    const numColumns = sheetData?.numColumns || 0;
    
    // If shift down, we extend, otherwise we bump
    if (arrowUp) {
        if (shiftPressed) {
            if (metaKeyPressed) {
                // We jump to before the column headers, unless we already are
                // in which case we jump to them
                if (selection.endingRowIndex === 0 || selection.endingRowIndex <= -1) { 
                    endingRowIndex = -1;
                } else {
                    endingRowIndex = 0;
                }
            } else {
                endingRowIndex = Math.max(selection.endingRowIndex - 1, -1);
            }
        } else {
            if (metaKeyPressed) {
                if (selection.startingRowIndex === 0 || selection.startingRowIndex <= -1) {
                    startingRowIndex = -1;
                } else {
                    startingRowIndex = 0;
                }
            } else {
                startingRowIndex = Math.max(selection.startingRowIndex - 1, -1);
            }
            endingRowIndex = startingRowIndex;
            endingColumnIndex = startingColumnIndex;
        }                
    } else if (arrowDown) {
        if (shiftPressed) {
            if (metaKeyPressed) {
                endingRowIndex = numRows - 1;
            } else {
                endingRowIndex = Math.min(selection.endingRowIndex + 1, numRows - 1);
            }
        } else if (altPressed) {
            // If alt+arrowdown is pressed, the keyboard shortcut for filtering is triggered
            // We don't want to change the selection
            return selection;
        } else {
            if (metaKeyPressed) {
                startingRowIndex = numRows - 1
            } else {
                startingRowIndex = Math.min(selection.startingRowIndex + 1, numRows - 1);
            }
            endingRowIndex = startingRowIndex;
            endingColumnIndex = startingColumnIndex;
        } 
    } else if (arrowLeft) {
        if (shiftPressed) {
            if (metaKeyPressed) {
                if (selection.endingColumnIndex === 0 || selection.endingColumnIndex <= -1) {
                    endingColumnIndex = -1;
                } else {
                    endingColumnIndex = 0;
                }
            } else {
                endingColumnIndex = Math.max(selection.endingColumnIndex - 1, -1);
            }
        } else {
            if (metaKeyPressed) {
                if (selection.startingColumnIndex === 0 || selection.startingColumnIndex <= -1) {
                    startingColumnIndex = -1;
                } else {
                    startingColumnIndex = 0;
                }
            } else {
                startingColumnIndex = Math.max(selection.startingColumnIndex - 1, -1);
            }
            endingColumnIndex = startingColumnIndex;
            endingRowIndex = startingRowIndex;
        }
    } else if (arrowRight) {
        if (shiftPressed) {
            if (metaKeyPressed) {
                endingColumnIndex = numColumns - 1;
            } else {
                endingColumnIndex = Math.min(selection.endingColumnIndex + 1, numColumns - 1);
            }
        } else {
            if (metaKeyPressed) {
                startingColumnIndex = numColumns - 1;
            } else {
                startingColumnIndex = Math.min(selection.startingColumnIndex + 1, numColumns - 1);
            }
            endingColumnIndex = startingColumnIndex;
            endingRowIndex = startingRowIndex;
        }
    } else if (tabPressed) {
        // Tab does not expand the selection, but rather just moves one to the right
        if (shiftPressed) {
            if (startingColumnIndex - 1 < -1) {
                if (startingRowIndex > -1) {
                    // Move up a row, if we're in the first cell in the row below
                    startingColumnIndex = numColumns - 1;
                    startingRowIndex -= 1;
                } 
            } else {
                startingColumnIndex -= 1;
                
                // Don't let the user select -1, -1
                if (startingColumnIndex <= -1 && startingRowIndex <= -1) {
                    startingColumnIndex = 0;
                }
            }
        } else {
            if (startingColumnIndex + 1 > numColumns - 1) {
                if (startingRowIndex < numRows - 1) {
                    // If the user is not in the last row, go to the next row if we are
                    // at the end of this current row
                    startingRowIndex += 1;
                    startingColumnIndex = -1;
                }
            } else {
                startingColumnIndex += 1;
            }
        }

        endingRowIndex = startingRowIndex; 
        endingColumnIndex = startingColumnIndex;
    }


    return {
        startingRowIndex: startingRowIndex,
        endingRowIndex: endingRowIndex,
        startingColumnIndex: startingColumnIndex,
        endingColumnIndex: endingColumnIndex,
        sheetIndex: selection.sheetIndex,
    }
}

/**
 * Returns all of the column indexes that are at least partially selected.
 */
export const getColumnIndexesInSelections = (selections: MitoSelection[]): number[] => {
    let columnIndexes: number[] = []
    selections.forEach(selection => {
        columnIndexes = columnIndexes.concat(getColumnIndexesInSingleSelection(selection))
    })
    // Deduplicate the list
    columnIndexes = [...new Set(columnIndexes)];
    return columnIndexes
}

export const getColumnIndexesInSingleSelection = (selection: MitoSelection): number[] => {
    const min = Math.min(selection.startingColumnIndex, selection.endingColumnIndex)
    const max = Math.max(selection.startingColumnIndex, selection.endingColumnIndex)

    const columnIndexes = [];
    for (let i = min; i <= max; i++) {
        columnIndexes.push(i);
    }

    return columnIndexes;
}

export const getColumnHeadersInSelection = (selection: MitoSelection, sheetData: SheetData): (ColumnHeader)[] => {
    const min = Math.min(selection.startingColumnIndex, selection.endingColumnIndex)
    const max = Math.max(selection.startingColumnIndex, selection.endingColumnIndex)

    const columnHeaders: (ColumnHeader)[] = [];
    for (let i = min; i < max + 1; i++) {
        if (sheetData.data[i] === undefined) continue;

        columnHeaders.push(sheetData.data[i].columnHeader)
    }

    // We make sure to return them in the order of the selection
    if (min !== selection.startingColumnIndex) {
        return columnHeaders.reverse();
    }

    return columnHeaders;
}

export const getColumnHeadersInSelections = (selections: MitoSelection[], sheetData: SheetData): (ColumnHeader)[] => {
    let columnHeaders: ColumnHeader[] = [];
    selections.forEach(selection => {
        columnHeaders = columnHeaders.concat(getColumnHeadersInSelection(selection, sheetData));
    })
    return columnHeaders;
}

export const getIndexLabelsInSelection = (selection: MitoSelection, sheetData: SheetData): (IndexLabel)[] => {
    const min = Math.min(selection.startingRowIndex, selection.endingRowIndex)
    const max = Math.max(selection.startingRowIndex, selection.endingRowIndex)

    const indexLabels: (IndexLabel)[] = []; // the type is wacky, but it's finme
    for (let i = min; i < max + 1; i++) {
        if (sheetData.index[i] === undefined) continue;
        indexLabels.push(sheetData.index[i])
    }

    return indexLabels;
}

export const getIndexLabelsInSelections = (selections: MitoSelection[], sheetData: SheetData): (IndexLabel)[] => {
    let indexLabels: (IndexLabel)[] = [];
    selections.forEach(selection => {
        indexLabels = indexLabels.concat(getIndexLabelsInSelection(selection, sheetData));
    })
    return indexLabels;
}

export const isSelectionsOnlyColumnHeaders = (selections: MitoSelection[]): boolean => {
    let isOnlyColumnHeaders = true
    selections.forEach(selection => {
        if (selection.startingRowIndex !== -1 || selection.endingRowIndex !== -1) {
            isOnlyColumnHeaders = false
        }
    });
    return isOnlyColumnHeaders
}

export const isSelectionsOnlyIndexHeaders = (selections: MitoSelection[]): boolean => {
    let isOnlyIndexHeaders = true
    selections.forEach(selection => {
        if (selection.startingColumnIndex !== -1 || selection.endingColumnIndex !== -1) {
            isOnlyIndexHeaders = false
        }
    });
    return isOnlyIndexHeaders
}


const _getUpperLeftOfSelection = (selection: MitoSelection, sheetData: SheetData): [ColumnHeader | undefined, IndexLabel | undefined] => {
    const minColumnIndex = Math.min(selection.startingColumnIndex, selection.endingColumnIndex)
    const minRowIndex = Math.min(selection.startingRowIndex, selection.endingRowIndex)

    const columnHeader = sheetData.data[minColumnIndex]?.columnHeader;
    const indexLabel = sheetData.index[minRowIndex];

    return [columnHeader, indexLabel];
}

const _getBottomRightOfSelection = (selection: MitoSelection, sheetData: SheetData): [ColumnHeader | undefined, IndexLabel | undefined] => {
    const maxColumnIndex = Math.max(selection.startingColumnIndex, selection.endingColumnIndex)
    const maxRowIndex = Math.max(selection.startingRowIndex, selection.endingRowIndex)

    const columnHeader = sheetData.data[maxColumnIndex]?.columnHeader;
    const indexLabel = sheetData.index[maxRowIndex];

    return [columnHeader, indexLabel];
}

export const getUpperLeftAndBottomRight = (selection: MitoSelection, sheetData: SheetData): [[ColumnHeader | undefined, IndexLabel | undefined], [ColumnHeader | undefined, IndexLabel | undefined]] => {
    const upperLeft = _getUpperLeftOfSelection(selection, sheetData);
    const bottomRight = _getBottomRightOfSelection(selection, sheetData);
    return [upperLeft, bottomRight]
}



const COPIED_BORDER_STYLE = '1px dashed black';
const SELECTED_BORDER_STYLE = '1px solid var(--mito-highlight)';
export const DEFAULT_BORDER_STYLE = '.5px solid var(--mito-text-light)';

/**
 * Returns the border styling on the selected cells, 
 * which allows us to put a bounding box around the
 * cells that highlights the selected range. Also 
 * handles highlighting the border between columns
 * when reordering columns. 
 */
export const getBorderStyle = (selections: MitoSelection[], copiedSelections: MitoSelection[], rowIndex: number, columnIndex: number, numRows: number, matchesSearch: boolean, highlightedColumnIndex?: number): BorderStyle => {
    const borderStyle: BorderStyle = {}

    // First, calculate the border based on the selections
    selections.forEach(selection => {
        const newBorderStyle = _getBorderStyle(selection, rowIndex, columnIndex, numRows, SELECTED_BORDER_STYLE, highlightedColumnIndex)

        // Reconcile the border based on the other selections
        borderStyle.borderRight = combineBorderStyles(borderStyle.borderRight, newBorderStyle.borderRight) 
        borderStyle.borderLeft = combineBorderStyles(borderStyle.borderLeft, newBorderStyle.borderLeft) 
        borderStyle.borderTop = combineBorderStyles(borderStyle.borderTop, newBorderStyle.borderTop) 
        borderStyle.borderBottom = combineBorderStyles(borderStyle.borderBottom, newBorderStyle.borderBottom) 
    })

    // Then, calculate the border based on the copied selections (if there are any)
    copiedSelections.forEach(selection => {
        const newBorderStyle = _getBorderStyle(selection, rowIndex, columnIndex, numRows, COPIED_BORDER_STYLE)

        // Reconcile the border based on the other selections
        borderStyle.borderRight = combineBorderStyles(borderStyle.borderRight, newBorderStyle.borderRight) 
        borderStyle.borderLeft = combineBorderStyles(borderStyle.borderLeft, newBorderStyle.borderLeft) 
        borderStyle.borderTop = combineBorderStyles(borderStyle.borderTop, newBorderStyle.borderTop) 
        borderStyle.borderBottom = combineBorderStyles(borderStyle.borderBottom, newBorderStyle.borderBottom) 
    })

    if (matchesSearch) {
        borderStyle.borderRight = combineBorderStyles(borderStyle.borderRight, SELECTED_BORDER_STYLE)
        borderStyle.borderLeft = combineBorderStyles(borderStyle.borderLeft, SELECTED_BORDER_STYLE)
        borderStyle.borderTop = combineBorderStyles(borderStyle.borderTop, SELECTED_BORDER_STYLE)
        borderStyle.borderBottom = combineBorderStyles(borderStyle.borderBottom, SELECTED_BORDER_STYLE)
    }

    return borderStyle
}

/**
 * Returns the border styling on the selected cells 
 * due to the specific selection, which allows us 
 * to put a bounding box around the cells that highlights the selected range
 */
export const _getBorderStyle = (selection: MitoSelection, rowIndex: number, columnIndex: number, numRows: number, inSelectionBorderStyle: string, highlightedColumnIndex?: number): BorderStyle => {

    // If not selected, just keep the default style
    if (!getIsCellSelected([selection], rowIndex, columnIndex)) {
        return {
            borderRight: highlightedColumnIndex === columnIndex ? SELECTED_BORDER_STYLE : DEFAULT_BORDER_STYLE,
            /* NOTE: put no left border on the index headers */
            borderLeft: (columnIndex !== -1 ? DEFAULT_BORDER_STYLE : undefined)
        };
    }

    // Take special care, as the starting and ending indexes may be bigger or smaller than each other
    const lowerRowIndex = selection.startingRowIndex < selection.endingRowIndex ? selection.startingRowIndex : selection.endingRowIndex;
    const higherRowIndex = selection.startingRowIndex > selection.endingRowIndex ? selection.startingRowIndex : selection.endingRowIndex;
    const lowerColumnIndex = selection.startingColumnIndex < selection.endingColumnIndex ? selection.startingColumnIndex : selection.endingColumnIndex;
    const higherColumnIndex = selection.startingColumnIndex > selection.endingColumnIndex ? selection.startingColumnIndex : selection.endingColumnIndex;

    // Put a border on the edge if the selection ends on that edge
    const borderTop = lowerRowIndex === rowIndex ? inSelectionBorderStyle : undefined;
    // Note: also highlight the bottom in the case that is the last element, and the whole column is selected
    const borderBottom = (higherRowIndex === rowIndex || (higherRowIndex <= -1 && rowIndex === numRows - 1)) ? inSelectionBorderStyle : undefined;
    const borderLeft = lowerColumnIndex === columnIndex ? inSelectionBorderStyle : undefined;
    const borderRight = (higherColumnIndex === columnIndex || highlightedColumnIndex === columnIndex) ? inSelectionBorderStyle : undefined;

    if (lowerRowIndex <= -1 && higherRowIndex <= -1) {
        // If only the column header is selected, then we select the entire column
        if (rowIndex <= -1) {
            return {
                borderTop: inSelectionBorderStyle,
                borderLeft: borderLeft || DEFAULT_BORDER_STYLE,
                borderRight: borderRight || DEFAULT_BORDER_STYLE,
            };
        } else {
            return {
                borderLeft: borderLeft || DEFAULT_BORDER_STYLE,
                borderRight: borderRight || DEFAULT_BORDER_STYLE,
                borderBottom: borderBottom
            };
        }
        
    }

    if (lowerColumnIndex <= -1 && higherColumnIndex <= -1) {
        // If only the index header is selected, then the entire row is
        if (columnIndex <= -1) {
            return {
                borderTop: borderTop,
                borderBottom: borderBottom,
                borderLeft: inSelectionBorderStyle,
                borderRight: DEFAULT_BORDER_STYLE,
            };
        } else {
            return {
                borderTop: borderTop,
                borderBottom: borderBottom,
                borderLeft: DEFAULT_BORDER_STYLE,
                borderRight: DEFAULT_BORDER_STYLE,
            };
        }
        
    }

    return {
        borderTop: borderTop,
        borderBottom: borderBottom,
        borderLeft: borderLeft || DEFAULT_BORDER_STYLE,
        borderRight: borderRight || DEFAULT_BORDER_STYLE
    }
}

/**
 * Helper function for determining the correct border style to apply, 
 * which is useful because cells might be in different selections and so get assigned different border styles.
 * Gives preference in the order: COPIED_BORDER_STYLE -> SELECTED_BORDER_STYLE -> DEFAULT_BORDER_STYLE -> undefined
 */
const combineBorderStyles = (oldBorderStyle?: string, newBorderStyle?: string): string | undefined => {
    if (oldBorderStyle === COPIED_BORDER_STYLE || newBorderStyle === COPIED_BORDER_STYLE) {
        return COPIED_BORDER_STYLE
    }

    if (oldBorderStyle === SELECTED_BORDER_STYLE || newBorderStyle === SELECTED_BORDER_STYLE) {
        return SELECTED_BORDER_STYLE
    }

    if (oldBorderStyle === DEFAULT_BORDER_STYLE || newBorderStyle === DEFAULT_BORDER_STYLE) {
        return DEFAULT_BORDER_STYLE
    }

    return oldBorderStyle
}

export const equalSelections = (selectionOne: MitoSelection, selectionTwo: MitoSelection): boolean => {
    return selectionOne.startingRowIndex === selectionTwo.startingRowIndex &&
        selectionOne.endingRowIndex === selectionTwo.endingRowIndex &&
        selectionOne.startingColumnIndex === selectionTwo.startingColumnIndex &&
        selectionOne.endingColumnIndex === selectionTwo.endingColumnIndex
}

/* 
    Assuming there was no additions, and no reorderings, we find the indexes
    that were deleted from the oldArray to the newArray
*/
const getDeletedIndexes = (oldArray: string[], newArray: string[]): number[] => {

    if (newArray.length < oldArray.length) {
        
        const oldDeletedIndexes: number[] = [];
        let oldIndex = 0;
        let newIndex = 0;
        while (oldIndex < oldArray.length && newIndex < newArray.length) {
            if (oldArray[oldIndex] !== newArray[newIndex]) {
                oldDeletedIndexes.push(oldIndex);
                oldIndex++;
            } else {
                newIndex++;
                oldIndex++;
            }
        }
        return oldDeletedIndexes;
    }
    return [];
}

/* 
    Handles when sheet data changes, potentially reordering, adding, or removing
    columns, specifically updating the selections to be what one would expect.
*/
export const reconciliateSelections = (oldSheetIndex: number, newSheetIndex: number, selections: MitoSelection[], oldColumnIDsArray: ColumnID[], sheetData: SheetData | undefined): MitoSelection[] => {
    return selections.map(selection => reconciliateSingleSelection(oldSheetIndex, newSheetIndex, selection, oldColumnIDsArray, sheetData))
}

/* 
    Handles when sheet data changes, potentially reordering, adding, or removing
    columns, specifically updating the __an individual selection__ to be what one would expect.
*/
export const reconciliateSingleSelection = (oldSheetIndex: number, newSheetIndex: number, selection: MitoSelection, oldColumnIDsArray: ColumnID[], sheetData: SheetData | undefined): MitoSelection => {
    
    // If the sheet switches, then reset selection
    if (oldColumnIDsArray === undefined || oldSheetIndex !== newSheetIndex || sheetData === undefined) {
        return {
            startingRowIndex: -1,
            endingRowIndex: -1,
            startingColumnIndex: 0,
            endingColumnIndex: 0,
            sheetIndex: newSheetIndex
        }
    }

    const newColumnsIDsArray = sheetData.data.map(c => c.columnID);

    if (oldColumnIDsArray.length > newColumnsIDsArray.length) {
        // Columns have been deleted
        const oldDeletedIndexes: number[] = getDeletedIndexes(oldColumnIDsArray, newColumnsIDsArray);

        // We find the number of indexes deleted from _before_ the selection, and _within_
        // the selection, so that we can adjust it
        const lowerColumnIndex = selection.startingColumnIndex < selection.endingColumnIndex ? selection.startingColumnIndex : selection.endingColumnIndex;
        const higherColumnIndex = selection.startingColumnIndex > selection.endingColumnIndex ? selection.startingColumnIndex : selection.endingColumnIndex;

        let numDeletedBeforeSelection = 0;
        let numDeletedInSelection = 0;
        for (let i = 0; i < oldDeletedIndexes.length; i++) {
            const deletedIndex = oldDeletedIndexes[i];
            if (deletedIndex <= lowerColumnIndex) {
                numDeletedBeforeSelection += 1
            } else if (deletedIndex > lowerColumnIndex && deletedIndex <= higherColumnIndex) {
                numDeletedInSelection += 1;
            }
        }

        let newLowerColumnIndex = lowerColumnIndex - numDeletedBeforeSelection;
        let newHigherColumnIndex = higherColumnIndex - numDeletedBeforeSelection - numDeletedInSelection;

        // We make sure that if you're deleting columns in the sheet, you don't accidently go and
        // select all the indexes
        if (selection.startingColumnIndex > -1 && selection.endingColumnIndex > -1) {
            newLowerColumnIndex = Math.max(newLowerColumnIndex, 0);
            newHigherColumnIndex = Math.max(newHigherColumnIndex, 0);
        }

        // If we're out of bounds, put is back in bounds
        if (newLowerColumnIndex > sheetData.numColumns - 1) {
            newLowerColumnIndex = sheetData.numColumns - 1;
        }
        if (newHigherColumnIndex > sheetData.numColumns - 1) {
            newHigherColumnIndex = sheetData.numColumns - 1;
        }

        // Make sure we keep the selection going the right direction
        const newStartingColumnIndex = selection.startingColumnIndex < selection.endingColumnIndex ? newLowerColumnIndex : newHigherColumnIndex;
        const newEndingColumnIndex = selection.startingColumnIndex > selection.endingColumnIndex ? newLowerColumnIndex : newHigherColumnIndex;

        return {
            startingRowIndex: selection.startingRowIndex,
            endingRowIndex: selection.endingRowIndex,
            startingColumnIndex: newStartingColumnIndex,
            endingColumnIndex: newEndingColumnIndex,
            sheetIndex: newSheetIndex
        }
    } else if (oldColumnIDsArray.length < newColumnsIDsArray.length) {
        // Columns have been added

        // Additions are just deletions from the new array to the old array, so we can
        // reuse this helper function
        const oldAddedIndexes: number[] = getDeletedIndexes(newColumnsIDsArray, oldColumnIDsArray);

        // We find the number of indexes added from _before_ the selection, and _within_
        // the selection, so that we can adjust it
        const lowerColumnIndex = selection.startingColumnIndex < selection.endingColumnIndex ? selection.startingColumnIndex : selection.endingColumnIndex;
        const higherColumnIndex = selection.startingColumnIndex > selection.endingColumnIndex ? selection.startingColumnIndex : selection.endingColumnIndex;

        let numAddedBeforeSelection = 0;
        let numAddedInSelection = 0;
        for (let i = 0; i < oldAddedIndexes.length; i++) {
            const addedIndex = oldAddedIndexes[i];
            if (addedIndex <= lowerColumnIndex) {
                numAddedBeforeSelection += 1
            } else if (addedIndex > lowerColumnIndex && addedIndex <= higherColumnIndex) {
                numAddedInSelection += 1;
            }
        }

        const newLowerColumnIndex = lowerColumnIndex + numAddedBeforeSelection;
        const newHigherColumnIndex = higherColumnIndex + numAddedBeforeSelection + numAddedInSelection;

        // Make sure we keep the selection going the right direction
        const newStartingColumnIndex = selection.startingColumnIndex < selection.endingColumnIndex ? newLowerColumnIndex : newHigherColumnIndex;
        const newEndingColumnIndex = selection.startingColumnIndex > selection.endingColumnIndex ? newLowerColumnIndex : newHigherColumnIndex;

        return {
            startingRowIndex: selection.startingRowIndex,
            endingRowIndex: selection.endingRowIndex,
            startingColumnIndex: newStartingColumnIndex,
            endingColumnIndex: newEndingColumnIndex,
            sheetIndex: newSheetIndex
        }

    } 

    // TODO: in the future, we might want to do reconciliation with the rowindexes as well, e.g. 
    // when filtering is going on. But we ignore it for now (not in ag-grid)
    return selection;
}

/**
 * 
 * Removes the column index from any selection that is a selection of only column headers
 * and contains the column.
 */
export const removeColumnFromSelections = (selections: MitoSelection[], columnIndex: number): MitoSelection[] => {
    const newSelections: MitoSelection[] = [] 
    selections.forEach(selection => {
        if (!isSelectionsOnlyColumnHeaders([selection]) || !getIsCellInSingleSelection(selection, -1, columnIndex)) {
            // Don't edit this section if it either: 1) is not a full column, or 2) doesn't contain the columnIndex
            newSelections.push(selection)
        } else {
            // If the columnIndex does exist in this selection then remove it.
            // If the columnIndex is the bound of the selection, then we only end up with 
            // one selection. Otherwise, we end up with two. 
            const smallerColumnIndex = selection.startingColumnIndex < selection.endingColumnIndex ? selection.startingColumnIndex : selection.endingColumnIndex
            const largerColumnIndex = selection.startingColumnIndex > selection.endingColumnIndex ? selection.startingColumnIndex : selection.endingColumnIndex
            if (smallerColumnIndex < columnIndex) {
                newSelections.push({
                    startingRowIndex: -1,
                    endingRowIndex: -1,
                    startingColumnIndex: smallerColumnIndex,
                    endingColumnIndex: columnIndex - 1,
                    sheetIndex: selection.sheetIndex
                })
            } 

            if (largerColumnIndex > columnIndex) {
                newSelections.push({
                    startingRowIndex: -1,
                    endingRowIndex: -1,
                    startingColumnIndex: columnIndex + 1,
                    endingColumnIndex: largerColumnIndex,
                    sheetIndex: selection.sheetIndex
                })
            }
        } 
    })

    // We never let the newSelections be empty to avoid error handling.
    // If it is empty, just select the first cell. 
    if (newSelections.length === 0) {
        newSelections.push({
            startingColumnIndex: 0,
            endingColumnIndex: 0,
            startingRowIndex: 0,
            endingRowIndex: 0,
            sheetIndex: 0
        })
    }

    return newSelections
}

export const isSelectionEntireSelectedColumn = (selection: MitoSelection): boolean => {
    return (selection.startingRowIndex === -1 && selection.endingRowIndex === -1);
}

export const getSelectedColumnIDsWithEntireSelectedColumn = (selections: MitoSelection[], sheetData: SheetData | undefined, inSameOrderAsDataframe?: boolean ): ColumnID[] => {
    if (sheetData === undefined) {
        return []
    }

    let columnIndexes: number[] = []
    selections.forEach(selection => {
        if (isSelectionEntireSelectedColumn(selection)) {
            columnIndexes = columnIndexes.concat(getColumnIndexesInSingleSelection(selection))
        }
    })
    // Deduplicate the list
    columnIndexes = [...new Set(columnIndexes)];
    if (inSameOrderAsDataframe) {
        columnIndexes = columnIndexes.sort();
    }

    return columnIndexes
        .filter(colIdx => sheetData.data.length > colIdx)
        .map(colIdx => sheetData.data[colIdx]?.columnID)
}


export const getSelectedRowLabelsInSingleSelection = (selection: MitoSelection, sheetData: SheetData): (string | number)[] => {
    const min = Math.min(selection.startingRowIndex, selection.endingRowIndex)
    const max = Math.max(selection.startingRowIndex, selection.endingRowIndex)

    const rowIndexes = [];
    for (let i = min; i <= max; i++) {
        rowIndexes.push(sheetData.index[i]);
    }

    return rowIndexes;
}


export const getSelectedRowLabelsWithEntireSelectedRow = (selections: MitoSelection[], sheetData: SheetData | undefined ): (string | number)[] => {
    if (sheetData === undefined) {
        return []
    }

    let rowIndexes: (string | number)[] = []
    selections.forEach(selection => {
        if (selection.startingColumnIndex === -1 && (selection.endingColumnIndex === -1 || selection.endingColumnIndex === sheetData.numColumns)) {
            rowIndexes = rowIndexes.concat(getSelectedRowLabelsInSingleSelection(selection, sheetData))
        }
    })
    
    return rowIndexes;

}

export const getNumberColumnIDs = (sheetData: SheetData | undefined, columnIDs: (ColumnID | undefined)[]): ColumnID[] => {
    const columnIDsAndDtypes: [ColumnID, string][] = columnIDs
        .filter(colId => colId !== undefined)
        .map(columnID => [columnID as ColumnID, sheetData?.columnDtypeMap[columnID as ColumnID] || ''])

    // Filter out any columns that are not number series
    return columnIDsAndDtypes
        .filter(([, columnDtype]) => {return columnDtype !== undefined && isNumberDtype(columnDtype)})
        .filter(([columnID, ]) => {return columnID !== undefined})
        .map(([columnID, ]) => {return columnID})

}


// Returns a list of column IDs of all of the selected columns that have number dtypes
export const getSelectedNumberSeriesColumnIDs = (selections: MitoSelection[], sheetData: SheetData | undefined ): ColumnID[] => {
    if (sheetData === undefined) {
        return []
    }

    const columnIndexesSelected = getColumnIndexesInSelections(selections);
    const columnIDs = columnIndexesSelected
        .filter(colIdx => sheetData.data.length > colIdx)
        .map(colIdx => sheetData.data[colIdx]?.columnID)
    
    return getNumberColumnIDs(sheetData, columnIDs);
}