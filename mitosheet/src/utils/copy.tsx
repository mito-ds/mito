import { FormatTypeObj, MitoSelection, SheetData } from "../types";
import { getDisplayColumnHeader } from "./columnHeaders";
import { formatCellData } from "./formatColumns";


// TODO: actually create a well-researched specification about how things should work (potentially argue for simplicity)
// TODO: fix the focus issue on Notebooks


const copy_valueToString = (value: string | number | boolean, columnDtype: string, columnFormatType: FormatTypeObj): string => {
    const formattedValue = formatCellData(value, columnDtype, columnFormatType);

    // TODO: handle the case where this is a string with tabs in it!

    return formattedValue;
}


const copy_getStringForRow = (sheetData: SheetData, rowIndex: number, lowColIndex: number, highColIndex: number): string => {
    let copyString = '';

    for (let columnIndex = lowColIndex; columnIndex <= highColIndex; columnIndex++) {
        if (rowIndex === -1) {
            copyString += getDisplayColumnHeader(sheetData.data[columnIndex].columnHeader)
        } else {
            copyString += copy_valueToString(
                sheetData.data[columnIndex].columnData[rowIndex],
                sheetData.data[columnIndex].columnDtype,
                sheetData.data[columnIndex].columnFormatTypeObj,
            )
        }
        
        if (columnIndex !== highColIndex) {
            copyString += '\t'
        }
    }
    
    return copyString;
}

const getSelectionsToCopy = (selections: MitoSelection[]): MitoSelection[] => {
    let lowRowIndex = Math.min(selections[0].startingRowIndex, selections[0].endingRowIndex);
    let highRowIndex = Math.max(selections[0].startingRowIndex, selections[0].endingRowIndex);

    const finalSelections = [selections[0]]

    // If the are multiple selections, we greedily take all those that have the same row bounds and size
    // and quit as soon as we hit a selection that does not meet this criteria. NOTE: Excel does something
    // very similar, where it pops up a modal that says "This action won't work on multiple selections."
    // So, this is a fine solution and likely something very rare anyways.
    for (let i = 1; i < selections.length; i++) {
        const selection = selections[i];
        let selectionLowRowIndex = Math.min(selection.startingRowIndex, selection.endingRowIndex);
        let selectionHighRowIndex = Math.max(selection.startingRowIndex, selection.endingRowIndex);

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


const copy_getStringForSelections = (sheetData: SheetData, selections: MitoSelection[]): string => {
    
    // Get the selections to copy
    selections = getSelectionsToCopy(selections);

    let lowRowIndex = Math.min(selections[0].startingRowIndex, selections[0].endingRowIndex);
    let highRowIndex = Math.max(selections[0].startingRowIndex, selections[0].endingRowIndex);
    
    // If we only have column headers selected, then we actually want to take the entire column
    if (lowRowIndex === -1 && highRowIndex === -1) {
        highRowIndex = sheetData.numRows - 1;
    }

    let copyString = '';
    for (let rowIndex = lowRowIndex; rowIndex <= highRowIndex; rowIndex++) {
        selections.forEach((selection, selectionIndex) => {
            const lowColIndex = Math.min(selection.startingColumnIndex, selection.endingColumnIndex);
            const highColIndex = Math.max(selection.startingColumnIndex, selection.endingColumnIndex);
            copyString += copy_getStringForRow(sheetData, rowIndex, lowColIndex, highColIndex);
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


export const getStringForClipboard = (sheetData: SheetData | undefined, selections: MitoSelection[]): string | undefined => {
    if (sheetData === undefined || selections.length === 0) {
        return undefined;
    }

    return copy_getStringForSelections(sheetData, selections);
}