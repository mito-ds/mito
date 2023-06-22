import { MAX_ROWS } from "../components/endo/EndoGrid";
import { isValueNone } from "../components/taskpanes/ControlPanel/FilterAndSortTab/filter/filterUtils";
import { ColumnFormatType, MitoSelection, SheetData } from "../types";
import { getColumnIDByIndex, getDisplayColumnHeader } from "./columnHeaders";
import { formatCellData } from "./format";


const getCopyStringForValue = (value: string | number | boolean, columnDtype: string, columnFormatType: ColumnFormatType | undefined): string => {
    if (isValueNone(value)) {
        return '';
    }
    return formatCellData(value, columnDtype, columnFormatType);
}

const getCopyStringForRow = (sheetData: SheetData, rowIndex: number, lowColIndex: number, highColIndex: number): string => {
    let copyString = '';
    
    for (let columnIndex = lowColIndex; columnIndex <= highColIndex; columnIndex++) {
        if (rowIndex === -1) {
            if (columnIndex === -1) {
                // There is nothing to copy here, so just skip it. We just keep this
                // case for symmetry
            } else {
                copyString += getDisplayColumnHeader(sheetData.data[columnIndex].columnHeader)
            }
        } else {
            if (columnIndex === -1) {
                copyString += sheetData.index[rowIndex];
            } else {
                const columnID = getColumnIDByIndex(sheetData, columnIndex);
                copyString += getCopyStringForValue(
                    sheetData.data[columnIndex].columnData[rowIndex],
                    sheetData.data[columnIndex].columnDtype,
                    sheetData.dfFormat.columns[columnID],
                )
            }
        }
        
        if (columnIndex !== highColIndex) {
            copyString += '\t'
        }
    }
    
    return copyString;
}

const getSelectionsToCopy = (selections: MitoSelection[]): MitoSelection[] => {
    const lowRowIndex = Math.min(selections[0].startingRowIndex, selections[0].endingRowIndex);
    const highRowIndex = Math.max(selections[0].startingRowIndex, selections[0].endingRowIndex);

    const finalSelections = [selections[0]]

    // If the are multiple selections, we greedily take all those that have the same row bounds and size
    // and quit as soon as we hit a selection that does not meet this criteria. NOTE: Excel does something
    // very similar, where it pops up a modal that says "This action won't work on multiple selections."
    // So, this is a fine solution and likely something very rare anyways.
    for (let i = 1; i < selections.length; i++) {
        const selection = selections[i];
        const selectionLowRowIndex = Math.min(selection.startingRowIndex, selection.endingRowIndex);
        const selectionHighRowIndex = Math.max(selection.startingRowIndex, selection.endingRowIndex);

        if (selectionLowRowIndex === lowRowIndex && selectionHighRowIndex === highRowIndex) {
            finalSelections.push(selection);
        } else {
            break;
        }
    }

    // Then, we order these selections in order of column index, as Excel
    // always copies in the order the data is, not the order that the selection
    // was made
    finalSelections.sort((selectionOne, selectionTwo) => {
        return selectionOne.startingColumnIndex - selectionTwo.startingColumnIndex 
    })

    return finalSelections;
}

const getCopyStringForSelections = (sheetData: SheetData, selections: MitoSelection[]): string => {

    const lowRowIndex = Math.min(selections[0].startingRowIndex, selections[0].endingRowIndex);
    let highRowIndex = Math.max(selections[0].startingRowIndex, selections[0].endingRowIndex);
    
    // If we only have column headers selected, then we actually want to take the entire column
    // making sure to not take more rows than there are
    if (lowRowIndex === -1 && highRowIndex === -1) {
        highRowIndex = Math.min(sheetData.numRows - 1, MAX_ROWS - 1);
    }

    let copyString = '';
    for (let rowIndex = lowRowIndex; rowIndex <= highRowIndex; rowIndex++) {
        selections.forEach((selection, selectionIndex) => {
            const lowColIndex = Math.min(selection.startingColumnIndex, selection.endingColumnIndex);
            let highColIndex = Math.max(selection.startingColumnIndex, selection.endingColumnIndex);

            // If the user has selected only the row header, then we make sure they copy the entire row
            if (lowColIndex === -1 && highColIndex === -1) {
                highColIndex = sheetData.numColumns - 1;
            }

            copyString += getCopyStringForRow(sheetData, rowIndex, lowColIndex, highColIndex);
            if (selectionIndex !== selections.length - 1) {
                copyString += '\t';
            }
        })
        if (rowIndex !== highRowIndex) {
            copyString += '\n'
        }
    }

    return copyString;
}

/**
 * A few notes on our copy and paste implementation:
 * 1.   This is V1. There are instances of data that get copied with messed up formatting, or
 *      in non-ideal ways. We can evolve this as we run into them.
 * 2.   This implementation is optimized for simplicity above anything else. As such, we choose
 *      tabs as delimiters simply because we observed gsheets doing the same, and we don't know
 *      enough to make a different choice.
 * 3.   Similarly to above, we choose not to escape internal tab characters because: we don't know
 *      how to, or how common they are, etc. 
 * 
 * The goal with this implementation is the simpliest thing that will work well 100% of the time 
 * for 90% of our users. While it may break in some cases, our lack of knowledge means a more 
 * complicated approach to copying almost certainly will lead to more issues.
 * 
 * 
 */
export const getCopyStringForClipboard = (sheetData: SheetData | undefined, selections: MitoSelection[]): [string, MitoSelection[]] | undefined => {
    if (sheetData === undefined || selections.length === 0) {
        return undefined;
    }

    const selectionsToCopy = getSelectionsToCopy(selections);

    return [getCopyStringForSelections(sheetData, selectionsToCopy), selectionsToCopy];
}

/**
 * A wrapper that makes sure copying to the clipboard works in all contexts, including
 * insecure contexts where the navigator.clipboard is not defined.
 * Adapted from: https://stackoverflow.com/questions/51805395/navigator-clipboard-is-undefined
 * 
 * @param text - the text to copy to the clipboard
 * @returns a promise that resolves or rejects depending on success
 */
export const writeTextToClipboard = (text: string): Promise<void> => {
    if (navigator.clipboard && window.isSecureContext) {
        // Navigator clipboard api needs a secure context (https)
        return navigator.clipboard.writeText(text);
    } else {
        // Text area method
        const textArea = document.createElement("textarea");
        textArea.value = text;
        // make the textarea not visible
        textArea.style.position = "absolute"; 
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        
        // Save the previous selected element
        const currentFocusedElement = document.activeElement;

        // Select the text area
        textArea.select();
        return new Promise((res, rej) => {
            // Actually do the copy
            document.execCommand('copy') ? res() : rej();
            textArea.remove();

            // Try to refocus on the element, if it is focusable
            try {
                (currentFocusedElement as any)?.focus();
            } catch (e) {
                console.log("Error refocusing on element", e);
            }
        });
    }
}