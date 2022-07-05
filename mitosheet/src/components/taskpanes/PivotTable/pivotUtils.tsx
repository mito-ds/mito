import { AggregationType, BackendPivotParams, FrontendPivotParams, SheetData } from "../../../types";


export const getDefaultPivotParams = (sheetDataArray: SheetData[], selectedSheetIndex: number, existingPivotParams: BackendPivotParams | undefined): FrontendPivotParams => {
    if (existingPivotParams === undefined) {
        return {
            selectedSheetIndex: selectedSheetIndex,
            pivotRowColumnIDs: [],
            pivotColumnsColumnIDs: [],
            pivotValuesColumnIDsArray: [],
            flattenColumnHeaders: true
        }
    } 

    return backendParamsToFrontendParams(existingPivotParams, sheetDataArray);
}

export const backendParamsToFrontendParams = (pivotParams: BackendPivotParams, sheetDataArray: SheetData[]): FrontendPivotParams => {
    return {
        selectedSheetIndex: Math.min(pivotParams.sheet_index, sheetDataArray.length - 1),
        pivotRowColumnIDs: pivotParams.pivot_rows_column_ids,
        pivotColumnsColumnIDs: pivotParams.pivot_columns_column_ids,
        pivotValuesColumnIDsArray: valuesRecordToArray(pivotParams.values_column_ids_map),
        flattenColumnHeaders: pivotParams.flatten_column_headers
    };
}

/* 
    A helper function for turning a record of values to an array, 
    which makes it much easier to work with in the pivot table 
    itself.
*/
export const valuesRecordToArray = (valuesRecord: Record<string, AggregationType[]>): [string, AggregationType][] => {
    const valuesArray: [string, AggregationType][] = [];

    Object.keys(valuesRecord).forEach(columnHeader => {
        valuesRecord[columnHeader].forEach(aggregationType => {
            valuesArray.push([columnHeader, aggregationType])
        })
    })

    return valuesArray;
}

/* 
    A helper function for turning a array of values to an record, 
    which is what the backend expects
*/
export const valuesArrayToRecord = (valuesArray: [string, AggregationType][]): Record<string, AggregationType[]> => {
    const valuesRecord: Record<string, AggregationType[]> = {};

    for (let i = 0; i < valuesArray.length; i++) {
        const [columnHeader, aggregationType] = valuesArray[i];
        if (valuesRecord[columnHeader] === undefined) {
            valuesRecord[columnHeader] = [];
        }
        valuesRecord[columnHeader].push(aggregationType);
    }
    return valuesRecord;
}