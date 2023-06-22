import { AggregationType, BackendPivotParams, ColumnID, FilterType, FrontendPivotParams, SheetData } from "../../../types";
import { isDatetimeDtype, isStringDtype, isTimedeltaDtype } from '../../../utils/dtypes';
import { getFiltersToApply } from "../ControlPanel/FilterAndSortTab/filter/filterUtils";

/**
 * Not every aggregation method works on all datatypes. 
 * We cover the most common cases when string, datetime, 
 * or timedelta columns are present.
 */
const STRING_AGGREGATIONS = [
    AggregationType.COUNT,
    AggregationType.COUNT_UNIQUE,
]
const DATETIME_AGGREGATIONS = [
    AggregationType.COUNT, 
    AggregationType.COUNT_UNIQUE,
    AggregationType.MEAN,
    AggregationType.MEDIAN,
    AggregationType.MIN,
    AggregationType.MAX
]
const TIMEDELTA_AGGREGATIONS = [
    AggregationType.COUNT, 
    AggregationType.COUNT_UNIQUE,
    AggregationType.SUM,
    AggregationType.MEAN,
    AggregationType.MEDIAN,
    AggregationType.MIN,
    AggregationType.MAX
]


export const getDefaultPivotParams = (sheetDataArray: SheetData[], sourceSheetIndex: number, existingPivotParams: BackendPivotParams | undefined): FrontendPivotParams | undefined => {
    if (sheetDataArray.length === 0) {
        return undefined;
    }
    
    if (existingPivotParams === undefined) {
        return {
            sourceSheetIndex: sourceSheetIndex,
            pivotRowColumnIDsWithTransforms: [],
            pivotColumnsColumnIDsWithTransforms: [],
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
        pivotRowColumnIDsWithTransforms: pivotParams.pivot_rows_column_ids_with_transforms,
        pivotColumnsColumnIDsWithTransforms: pivotParams.pivot_columns_column_ids_with_transforms,
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

    return {
        sheet_index: params.sourceSheetIndex,
        pivot_rows_column_ids_with_transforms: params.pivotRowColumnIDsWithTransforms,
        pivot_columns_column_ids_with_transforms: params.pivotColumnsColumnIDsWithTransforms,
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

export const getPivotAggregationDisabledMessage = (aggregationType: AggregationType, columnDtype: string): string | undefined =>  {
    if (isStringDtype(columnDtype) && !STRING_AGGREGATIONS.includes(aggregationType)) {
        return `Not valid for string column`
    } else if (isDatetimeDtype(columnDtype) && !DATETIME_AGGREGATIONS.includes(aggregationType)) {
        return `Not valid for datetime column`;
    } else if (isTimedeltaDtype(columnDtype) && !TIMEDELTA_AGGREGATIONS.includes(aggregationType)) {
        return `Not valid for timedelta column`
    }

    return undefined;

}