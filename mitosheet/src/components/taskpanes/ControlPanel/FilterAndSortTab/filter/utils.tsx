// Copyright (c) Mito

import { FilterType } from '../../../../../types';
import { isBoolDtype, isDatetimeDtype, isNumberDtype, isStringDtype, isTimedeltaDtype } from '../../../../../utils/dtypes';
import { CONDITIONS_WITH_NO_INPUT } from './filterConditions';

/*
    Given that we cannot filter all datatypes well, we have this utility 
    for getting the message if the filters are disabled for a certain
    columnDtpye
*/
export function getFilterDisabledMessage(columnDtype: string): string | undefined {
    if (isTimedeltaDtype(columnDtype)) {
        return 'Sorry, Mito does not support filtering on timedeltas columns currently. Try changing the column dtype to a string and filtering on that instead.'
    }
    return undefined;
}

/*
    Returns the correct empty filter data object for the given columnMitoType
*/
export function getEmptyFilterData(columnDtype: string): FilterType {

    if (isBoolDtype(columnDtype)) {
        return {
            condition: 'boolean_is_true',
            value: ''
        }
    } else if (isStringDtype(columnDtype)) {
        return {
            condition: 'contains',
            value: ''
        }
    } else if (isNumberDtype(columnDtype)) {
        return {
            condition: 'greater',
            value: ''
        }
    } else if (isDatetimeDtype(columnDtype)) {
        return {
            condition: 'datetime_exactly',
            value: ''
        }
    } else {
        // We include a default return, to stop filters on columns
        // like timedeltas from crashing the sheet if you add
        // a filter to it (although it's non functional :( )
        return {
            condition: 'contains',
            value: ''
        }
    }
}

/* 
    A filter is invalid if:
    1. It should have an input, and it does not
    2. It is a number filter with a string input, or with a non-valid number input        
*/
export const isValidFilter = (filter: FilterType, columnDtype: string): boolean => {
    if (CONDITIONS_WITH_NO_INPUT.includes(filter.condition)) {
        return true;
    }

    // Number series
    if (isNumberDtype(columnDtype)) {
        return typeof filter.value !== 'string' && !isNaN(filter.value);
    }
    // String or datetime
    if (isStringDtype(columnDtype) || isDatetimeDtype(columnDtype)) {
        return filter.value !== '';
    }

    return true;
}

/* 
    The frontend stores number filters as strings, and so we parse them to
    numbers before sending them to the backend
*/
export const parseFilter = (filter: FilterType, columnDtype: string): FilterType => {
    if (isNumberDtype(columnDtype) && typeof filter.value === 'string') {
        return {
            condition: filter.condition,
            value: parseFloat(filter.value)
        }
    }
    return filter;
}


/*
    Helper function for determining if a value is representative of a None value. 
    Because values gets casted all over the codebase, its important that we are able to 
    to detect when values are None so we can treat them the same. 
*/
export const isValueNone = (value: string | number | boolean): boolean => {
    return value === 'NaN' || value === 'nan' || value === 'NaT' || value === 'nat' || value === null || value === undefined
}
