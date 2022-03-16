// Contains temp helper functions for casting from dataframe id -> sheet index,
// which allows us to easily keep track of all the places that we are doing this
// cast explicitly

import { DataframeID } from "../types";

export const getPreviousDataframeID = (dataframeID: DataframeID): DataframeID => {
    return dataframeIDToSheetIndex(dataframeID) > 0 ? sheetIndexToDataframeID(dataframeIDToSheetIndex(dataframeID) - 1) : '0';
}

export const dataframeIDToSheetIndex = (dataframeID: DataframeID): number => {
    return parseInt(dataframeID);
}

export const sheetIndexToDataframeID = (sheetIndex: number): DataframeID => {
    return '' + sheetIndex;
}