import { AggregationType, BackendPivotParams, ColumnID, FilterType, FrontendPivotParams, SheetData } from "../../../types";
import { getDeduplicatedArray } from "../../../utils/arrays";
import { getFiltersToApply } from "../ControlPanel/FilterAndSortTab/filter/filterUtils";


export const getDefaultPivotParams = (sheetDataArray: SheetData[], sourceSheetIndex: number, existingPivotParams: BackendPivotParams | undefined): FrontendPivotParams | undefined => {
    if (sheetDataArray.length === 0) {
        return undefined;
    }
    
    if (existingPivotParams === undefined) {
        return {
            sourceSheetIndex: sourceSheetIndex,
            pivotRowColumnIDs: [],
            pivotColumnsColumnIDs: [],
            pivotValuesColumnIDsArray: [],
            pivotFilters: [],
            flattenColumnHeaders: true,
            destinationSheetIndex: undefined
        }
    } 

    return getPivotFrontendParamsFromBackendParams(existingPivotParams);
}

export const getPivotFrontendParamsFromBackendParams = (pivotParams: BackendPivotParams): FrontendPivotParams => {
    return {
        sourceSheetIndex: pivotParams.sheet_index,
        pivotRowColumnIDs: pivotParams.pivot_rows_column_ids,
        pivotColumnsColumnIDs: pivotParams.pivot_columns_column_ids,
        pivotValuesColumnIDsArray: valuesRecordToArray(pivotParams.values_column_ids_map),
        pivotFilters: pivotParams.pivot_filters,
        flattenColumnHeaders: pivotParams.flatten_column_headers,
        destinationSheetIndex: pivotParams.destination_sheet_index
    };
}

export const getPivotBackendParamsFromFrontendParams = (params: FrontendPivotParams, sheetDataArray?: SheetData[]): BackendPivotParams => {

    // Before sending the parameters to the backend, we have to parse the filters
    // and make sure they are parsable, valid, etc. We filter out any pivotFilters
    // that aren't
    const columnDtypeMap = sheetDataArray !== undefined ? sheetDataArray[params.sourceSheetIndex]?.columnDtypeMap || {} : {};
    const pivotFiltersToApply: {column_id: ColumnID, filter: FilterType}[] = params.pivotFilters.map(({column_id, filter}) => {
        const columnDtype = columnDtypeMap[column_id] || '';
        const finalFilters = getFiltersToApply([filter], columnDtype);

        if (finalFilters.length === 0) {
            return undefined;
        }
        
        return {
            'column_id': column_id,
            'filter': finalFilters[0]
        }
    }).filter((pf) => pf !== undefined) as {column_id: ColumnID, filter: FilterType}[];
    console.log(params.pivotFilters, pivotFiltersToApply);

    return {
        sheet_index: params.sourceSheetIndex,
        // Deduplicate the rows and columns before sending them to the backend
        // as otherwise this generates errors if you have duplicated key
        pivot_rows_column_ids: getDeduplicatedArray(params.pivotRowColumnIDs),
        pivot_columns_column_ids: getDeduplicatedArray(params.pivotColumnsColumnIDs),
        values_column_ids_map: valuesArrayToRecord(params.pivotValuesColumnIDsArray),
        pivot_filters: pivotFiltersToApply,
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