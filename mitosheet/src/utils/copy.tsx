import { isValueNone } from "../components/taskpanes/ControlPanel/FilterAndSortTab/filter/utils";
import { FormatTypeObj, MitoSelection, SheetData } from "../types";
import { getDisplayColumnHeader } from "./columnHeaders";
import { formatCellData } from "./formatColumns";


const getCopyStringForValue = (value: string | number | boolean, columnDtype: string, columnFormatType: FormatTypeObj): string => {
    if (isValueNone(value)) {
        return '';
    }
    return formatCellData(value, columnDtype, columnFormatType);
}

const getCopyStringForRow = (sheetData: SheetData, rowIndex: number, lowColIndex: number, highColIndex: number): string => {
    let copyString = '';

    for (let columnIndex = lowColIndex; columnIndex <= highColIndex; columnIndex++) {
        if (rowIndex === -1) {
            copyString += getDisplayColumnHeader(sheetData.data[columnIndex].columnHeader)
        } else if (columnIndex === -1) {
            // Currently, we allow users to copy index headers as they sometimes
            // contain data that is useful
            copyString += sheetData.index[rowIndex];
        } else {
            copyString += getCopyStringForValue(
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
    if (lowRowIndex === -1 && highRowIndex === -1) {
        highRowIndex = sheetData.numRows - 1;
    }

    let copyString = '';
    for (let rowIndex = lowRowIndex; rowIndex <= highRowIndex; rowIndex++) {
        selections.forEach((selection, selectionIndex) => {
            const lowColIndex = Math.min(selection.startingColumnIndex, selection.endingColumnIndex);
            const highColIndex = Math.max(selection.startingColumnIndex, selection.endingColumnIndex);
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

export const getCopyStringForClipboard = (sheetData: SheetData | undefined, selections: MitoSelection[]): [string, MitoSelection[]] | undefined => {
    if (sheetData === undefined || selections.length === 0) {
        return undefined;
    }

    const selectionsToCopy = getSelectionsToCopy(selections);

    return [getCopyStringForSelections(sheetData, selectionsToCopy), selectionsToCopy];
}