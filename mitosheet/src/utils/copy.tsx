import { MitoSelection, SheetData } from "../types";


// TODO: actually create a well-researched specification about how things should work (potentially argue for simplicity)
// TODO: fix the focus issue on Notebooks

const copy_stringValueToString = (value: string): string => {
    return value;
}

const copy_valueToString = (value: string | number | boolean): string => {
    if (typeof value === 'string') {
        return copy_stringValueToString(value);
    }

    return '' + value;
}


const copy_getStringForRow = (sheetData: SheetData, rowIndex: number, lowColIndex: number, highColIndex: number): string => {
    let copyString = '';

    for (let columnIndex = lowColIndex; columnIndex <= highColIndex; columnIndex++) {
        copyString += copy_valueToString(sheetData.data[columnIndex].columnData[rowIndex])
        if (columnIndex !== highColIndex) {
            copyString += '\t'
        }
    }
    
    return copyString;
}


const copy_getStringForSelection = (sheetData: SheetData, selection: MitoSelection): string => {
    const lowRowIndex = Math.min(selection.startingRowIndex, selection.endingRowIndex);
    const highRowIndex = Math.max(selection.startingRowIndex, selection.endingRowIndex);
    const lowColIndex = Math.min(selection.startingColumnIndex, selection.endingColumnIndex);
    const highColIndex = Math.max(selection.startingColumnIndex, selection.endingColumnIndex);

    let copyString = '';
    for (let rowIndex = lowRowIndex; rowIndex <= highRowIndex; rowIndex++) {
        copyString += copy_getStringForRow(sheetData, rowIndex, lowColIndex, highColIndex);
        if (rowIndex !== highRowIndex) {
            copyString += '\n'
        }
    }

    return copyString;
}


export const getStringForClipboard = (sheetData: SheetData | undefined, selections: MitoSelection[]): string | undefined => {
    if (sheetData === undefined || selections.length === 0) {
        console.log("HERE")
        return undefined;
    }

    if (selections.length === 1) {
        return copy_getStringForSelection(sheetData, selections[0]);
    }

    return "More than one selection..."
}