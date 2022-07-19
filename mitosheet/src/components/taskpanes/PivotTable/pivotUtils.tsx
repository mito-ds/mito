import { AggregationType, BackendPivotParams, FrontendPivotParams, SheetData } from "../../../types";
import { getDeduplicatedArray } from "../../../utils/arrays";


export const getDefaultPivotParams = (sheetDataArray: SheetData[], selectedSheetIndex: number, existingPivotParams: BackendPivotParams | undefined): FrontendPivotParams | undefined => {
    if (sheetDataArray.length === 0) {
        return undefined;
    }
    
    if (existingPivotParams === undefined) {
        return {
            selectedSheetIndex: selectedSheetIndex,
            pivotRowColumnIDs: [],
            pivotColumnsColumnIDs: [],
            pivotValuesColumnIDsArray: [],
            flattenColumnHeaders: true,
            destinationSheetIndex: undefined
        }
    } 

    return getPivotFrontendParamsFromBackendParams(existingPivotParams);
}

export const getPivotFrontendParamsFromBackendParams = (pivotParams: BackendPivotParams): FrontendPivotParams => {
    return {
        selectedSheetIndex: pivotParams.sheet_index,
        pivotRowColumnIDs: pivotParams.pivot_rows_column_ids,
        pivotColumnsColumnIDs: pivotParams.pivot_columns_column_ids,
        pivotValuesColumnIDsArray: valuesRecordToArray(pivotParams.values_column_ids_map),
        flattenColumnHeaders: pivotParams.flatten_column_headers,
        destinationSheetIndex: pivotParams.destination_sheet_index
    };
}

export const getPivotBackendParamsFromFrontendParams = (params: FrontendPivotParams): BackendPivotParams => {
    return {
        sheet_index: params.selectedSheetIndex,
        // Deduplicate the rows and columns before sending them to the backend
        // as otherwise this generates errors if you have duplicated key
        pivot_rows_column_ids: getDeduplicatedArray(params.pivotRowColumnIDs),
        pivot_columns_column_ids: getDeduplicatedArray(params.pivotColumnsColumnIDs),
        values_column_ids_map: valuesArrayToRecord(params.pivotValuesColumnIDsArray),
        flatten_column_headers: params.flattenColumnHeaders,
        destination_sheet_index: params.destinationSheetIndex,
    }
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