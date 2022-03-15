// Contains temp helper functions for casting from dataframe id -> sheet index,
// which allows us to easily keep track of all the places that we are doing this
// cast explicitly

import { DataframeID } from "../types";


export const dataframeIDToSheetIndex = (dataframeID: DataframeID): number => {
    return parseInt(dataframeID);
}

export const sheetIndexToDataframeID = (sheetIndex: number): DataframeID => {
    return '' + sheetIndex;
}