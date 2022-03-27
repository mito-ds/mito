// Copyright (c) Mito

import { ColumnID, SheetData } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';


type SuggestedKeys = {
    merge_key_column_id_one: ColumnID,
    merge_key_column_id_two: ColumnID
}

/*
    Given two sheet indexes, reccomends a key to merge on,
    based on which column headers are displayed the same
*/
export const getSuggestedKeysColumnID = (sheetDataArray: SheetData[], sheetOneIndex: number, sheetTwoIndex: number): SuggestedKeys | undefined => {
    
    const sheetOneEntries = Object.entries(sheetDataArray[sheetOneIndex]?.columnIDsMap || {});
    const sheetTwoEntries = Object.entries(sheetDataArray[sheetTwoIndex]?.columnIDsMap || {});
    let columnIDsWithSharedColumnHeaders: ([string, string] | undefined)[] = sheetOneEntries.map(([columnID, columnHeader]) => {
        const matchingIndex = sheetTwoEntries.findIndex(([, otherColumnHeader]) => {return getDisplayColumnHeader(columnHeader) === getDisplayColumnHeader(otherColumnHeader)});
        if (matchingIndex > -1) {
            return [columnID, sheetTwoEntries[matchingIndex][0]];
        } else {
            return undefined;
        }
    });

    columnIDsWithSharedColumnHeaders = columnIDsWithSharedColumnHeaders.filter(cid => cid !== undefined);
    
    // Make sure everything is defined; handles if there are no columns in a sheet
    const columnIDOne = columnIDsWithSharedColumnHeaders[0] ? columnIDsWithSharedColumnHeaders[0][0] : 
        (sheetOneEntries[0] ? sheetOneEntries[0][0] : undefined);
    const columnIDTwo = columnIDsWithSharedColumnHeaders[0] ? columnIDsWithSharedColumnHeaders[0][1] :
        (sheetTwoEntries[0] ? sheetTwoEntries[0][0] : undefined);

    if (columnIDOne === undefined || columnIDTwo === undefined) {
        return undefined;
    }
    
    return {
        merge_key_column_id_one: columnIDOne,
        merge_key_column_id_two: columnIDTwo
    }
}