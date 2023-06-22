// Copyright (c) Mito

import { ColumnID, SheetData } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';


/*
    Given two sheet indexes, reccomends a key to merge on,
    based on which column headers are displayed the same
*/
export const getFirstSuggestedMergeKeys = (sheetDataArray: SheetData[], sheetOneIndex: number, sheetTwoIndex: number, existingMergeKeys?: [ColumnID, ColumnID][]): [ColumnID, ColumnID] | undefined => {
    
    const sheetOneEntries = Object.entries(sheetDataArray[sheetOneIndex]?.columnIDsMap || {});
    const sheetTwoEntries = Object.entries(sheetDataArray[sheetTwoIndex]?.columnIDsMap || {});
    const columnIDsWithSharedColumnHeaders: ([ColumnID, ColumnID] | undefined)[] = sheetOneEntries.map(([columnID, columnHeader]) => {
        const matchingIndex = sheetTwoEntries.findIndex(([, otherColumnHeader]) => {return getDisplayColumnHeader(columnHeader) === getDisplayColumnHeader(otherColumnHeader)});
        if (matchingIndex > -1) {
            return [columnID, sheetTwoEntries[matchingIndex][0]];
        } else {
            return undefined;
        }
    });

    const allSuggestions = columnIDsWithSharedColumnHeaders.filter(cid => cid !== undefined) as [ColumnID, ColumnID][];
    if (allSuggestions.length === 0) {
        // If there are no column ids, then we just return undefined
        if (sheetOneEntries[0] === undefined || sheetTwoEntries[0] === undefined) {
            return undefined;
        }

        return [sheetOneEntries[0][0], sheetTwoEntries[0][0]];
    } else {
        // Get the first suggestion that is not included, or just default to the first suggestion
        if (!existingMergeKeys) {
            return allSuggestions[0];
        } else {
            const notIncludedSuggestions = allSuggestions.filter(([columnIDOne, columnIDTwo]) => {
                const columnIDOneUsed = existingMergeKeys.findIndex(([mergeKeyOne, ]) => {return columnIDOne === mergeKeyOne}) !== -1;
                const columnIDTwoUsed = existingMergeKeys.findIndex(([, mergeKeyTwo]) => {return columnIDTwo === mergeKeyTwo}) !== -1;
                return !columnIDOneUsed && !columnIDTwoUsed;
            })

            if (notIncludedSuggestions.length === 0) {
                return allSuggestions[0]
            } else {
                return notIncludedSuggestions[0]
            }
        }
    }
}