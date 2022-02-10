// Copyright (c) Mito

import { FilterType, FilterGroupType } from '../../../../../types';
import { isBoolDtype, isDatetimeDtype, isNumberDtype, isStringDtype } from '../../../../../utils/dtypes';
import { CONDITIONS_WITH_NO_INPUT } from './filterConditions';
import { isFilterGroup } from './filterTypes';


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
    Returns the a filter data object that excluded the value for the given columnMitoType
*/
export function getExclusiveFilterData(columnDtype: string, value: string | number | boolean): FilterType {
    const isNaN = isValueNone(value)

    if (isBoolDtype(columnDtype)) {
        return {
            condition: isNaN ? 'not_empty' : value ? 'boolean_is_false' : 'boolean_is_true',
            value: '' // Boolean filters don't utilize a value
        }
    } else if (isStringDtype(columnDtype)) {
        return {
            condition: isNaN ? 'not_empty' : 'string_not_exactly',
            // The StringFilterType requires that the value be a string. However, we don't actually cast it to a string
            // because we'd prefer an error to be thrown to let the user that the filter failed than for the incorrect filter to be generated.
            // In particular: if the series is [1, 2, 'aaron'], and the user filters out 1, then the backend will throw an error because 1 is not a string.
            // However, if we actually cast to a string, then the filter generated will be != '1', which will have no effect.
            value: value as string 
        }
    } else if (isNumberDtype(columnDtype)) {
        return {
            condition: isNaN ? 'not_empty' : 'number_not_exactly',
            value: value as number | string // The NumberFilterType accepts either numbers or strings as the value
        }
    } else if (isDatetimeDtype(columnDtype)) {
        return {
            condition: isNaN ? 'not_empty' : 'datetime_not_exactly', 
            // The DatetimeFilterType accepts either numbers or strings as the value, but notably,
            // If the value is set through the Values Tab, then it will be in the format yyyy/mm/dd hh:mm:ss.
            // This input field only supports the format yyyy/mm/dd, so we discard the time component if it exists
            value: (value as string).split(' ')[0] 
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
    Returns all of the values that are filtered out through a does not contain filter 
*/
export const getAllDoesNotContainsFilterValues = (filters: (FilterType | FilterGroupType)[], columnDtype: string): (string | number | boolean)[] => {

    const filteredOutValues: (string | number | boolean)[] = []
    filters.forEach(filterOrGroup => {
        if (isFilterGroup(filterOrGroup)) {
            return 
        } else if (isBoolDtype(columnDtype)) {
            // Handle booleans separately since they don't have a NOT_EXACTLY condition
            if (filterOrGroup.condition === 'boolean_is_false') {
                filteredOutValues.push(true)
            } else if (filterOrGroup.condition === 'boolean_is_true') {
                filteredOutValues.push(false)
            }
        } else {
            // If the condition is a NOT_EXACTLY filter condition then add the value to the list of filtered out values
            // Note: we don't have filter conditions for timedelta series
            if (filterOrGroup.condition === getNotExactlyFilterCondition(columnDtype)) {
                filteredOutValues.push(filterOrGroup.value)
            
            // If the condition is the NOT_EMPTY filter condition (note: all NOT_EMPTY conditions are the same regaurdless of columnMitoType)
            // then add 'NaN' to the list of filtered out values
            } else if (filterOrGroup.condition === 'not_empty') {
                filteredOutValues.push('NaN')
            }
        }
    });
    return filteredOutValues
}

/*
    Given a columnDtype, returns the appropriate NOT_EXACTLY filter condition. 
    Returns '' if none exists.
*/
const getNotExactlyFilterCondition = (columnDtype: string): string => {

    if (isNumberDtype(columnDtype)) {
        return 'number_not_exactly'
    } else if (isStringDtype(columnDtype)) {
        return 'string_not_exactly' 
    } else if (isDatetimeDtype(columnDtype)) {
        return 'datetime_not_exactly'
    } else {
        return ''
    }
}

/* 
    Given two FilterTypes returns true if they are equal and false otherwise. 
*/
export const areFiltersEqual = (filterOne: FilterType, filterTwo: FilterType): boolean => {

    // Because we treat all types of none values as the same, we do a quick check 
    // to determine if the filter.value is a None. 
    const valueOne = isValueNone(filterOne.value) || filterOne.value
    const valueTwo = isValueNone(filterOne.value) || filterTwo.value

    return valueOne == valueTwo && filterOne.condition === filterTwo.condition
}

/*
    Helper function for determining if a value is representative of a None value. 
    Because values gets casted all over the codebase, its important that we are able to 
    to detect when values are None so we can treat them the same. 
*/
const isValueNone = (value: string | number | boolean): boolean => {
    return value === 'NaN' || value === 'nan' || value === 'NaT' || value === 'nat' || value === null || value === undefined
}
