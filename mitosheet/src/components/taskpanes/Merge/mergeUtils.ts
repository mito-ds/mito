// Copyright (c) Mito

import { ColumnID, DataframeID, SheetData } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';


type SuggestedKeys = {
    mergeKeyColumnIDOne: ColumnID | undefined,
    mergeKeyColumnIDTwo: ColumnID | undefined
}

/*
    Given two sheet indexes, reccomends a key to merge on,
    based on which column headers are displayed the same
*/
export const getSuggestedKeysColumnID = (sheetDataMap: Record<DataframeID, SheetData>, dataframeIDOne: DataframeID, dataframeIDTwo: DataframeID): SuggestedKeys => {

    const sheetOneEntries = Object.entries(sheetDataMap[dataframeIDOne]?.columnIDsMap);
    const sheetTwoEntries = Object.entries(sheetDataMap[dataframeIDTwo]?.columnIDsMap);
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
    
    return {
        mergeKeyColumnIDOne: columnIDOne,
        mergeKeyColumnIDTwo: columnIDTwo
    }
}