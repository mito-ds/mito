// Copyright (c) Mito

import { ColumnIDsMap } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';


type SuggestedKeys = {
    mergeKeyColumnIDOne: string,
    mergeKeyColumnIDTwo: string
}

/*
    Given two sheet indexes, reccomends a key to merge on,
    based on which column headers are displayed the same
*/
export const getSuggestedKeysColumnID = (columnIDsMapArray: ColumnIDsMap[], sheetOneIndex: number, sheetTwoIndex: number): SuggestedKeys => {
    
    const sheetOneEntries = Object.entries(columnIDsMapArray[sheetOneIndex]);
    const sheetTwoEntries = Object.entries(columnIDsMapArray[sheetTwoIndex]);
    let columnIDsWithSharedColumnHeaders: ([string, string] | undefined)[] = sheetOneEntries.map(([columnID, columnHeader]) => {
        const matchingIndex = sheetTwoEntries.findIndex(([, otherColumnHeader]) => {return getDisplayColumnHeader(columnHeader) === getDisplayColumnHeader(otherColumnHeader)});
        if (matchingIndex > -1) {
            return [columnID, sheetTwoEntries[matchingIndex][0]];
        } else {
            return undefined;
        }
    });

    columnIDsWithSharedColumnHeaders = columnIDsWithSharedColumnHeaders.filter(cid => cid !== undefined);
    
    const columnIDOne = columnIDsWithSharedColumnHeaders[0] ? columnIDsWithSharedColumnHeaders[0][0] : sheetOneEntries[0][0];
    const columnIDTwo = columnIDsWithSharedColumnHeaders[0] ? columnIDsWithSharedColumnHeaders[0][1] : sheetTwoEntries[0][0];
    
    return {
        mergeKeyColumnIDOne: columnIDOne,
        mergeKeyColumnIDTwo: columnIDTwo
    }
}