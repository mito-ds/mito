// Copyright (c) Mito

import { BooleanFilterCondition, SeriesFilterType, DatetimeFilterCondition, FilterType, NumberFilterCondition, StringFilterCondition, FilterGroupType } from '../../../../../types';
import { isBoolDtype, isDatetimeDtype, isNumberDtype, isStringDtype } from '../../../../../utils/dtypes';
import { CONDITIONS_WITH_NO_INPUT } from './filterConditions';
import { isFilterGroup } from './filterTypes';

/*
    Returns the correct empty filter data object for the given columnMitoType
*/
export function getEmptyFilterData(columnDtype: string): FilterType {

    if (isBoolDtype(columnDtype)) {
        return {
            type: SeriesFilterType.BOOLEAN_SERIES,
            condition: BooleanFilterCondition.IS_TRUE,
            value: ''
        }
    } else if (isStringDtype(columnDtype)) {
        return {
            type: SeriesFilterType.STRING_SERIES,
            condition: StringFilterCondition.CONTAINS,
            value: ''
        }
    } else if (isNumberDtype(columnDtype)) {
        return {
            type: SeriesFilterType.NUMBER_SERIES,
            condition: NumberFilterCondition.GREATER,
            value: ''
        }
    } else if (isDatetimeDtype(columnDtype)) {
        return {
            type: SeriesFilterType.DATETIME_SERIES,
            condition: DatetimeFilterCondition.DATETIME_EXTACTLY,
            value: ''
        }
    } else {
        // We include a default return, to stop filters on columns
        // like timedeltas from crashing the sheet if you add
        // a filter to it (although it's non functional :( )
        return {
            type: SeriesFilterType.STRING_SERIES,
            condition: StringFilterCondition.CONTAINS,
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
            type: SeriesFilterType.BOOLEAN_SERIES,
            condition: isNaN ? BooleanFilterCondition.NOT_EMPTY : value ? BooleanFilterCondition.IS_FALSE : BooleanFilterCondition.IS_TRUE,
            value: '' // Boolean filters don't utilize a value
        }
    } else if (isStringDtype(columnDtype)) {
        return {
            type: SeriesFilterType.STRING_SERIES,
            condition: isNaN ? StringFilterCondition.NOT_EMPTY : StringFilterCondition.STRING_NOT_EXACTLY,
            // The StringFilterType requires that the value be a string. However, we don't actually cast it to a string
            // because we'd prefer an error to be thrown to let the user that the filter failed than for the incorrect filter to be generated.
            // In particular: if the series is [1, 2, 'aaron'], and the user filters out 1, then the backend will throw an error because 1 is not a string.
            // However, if we actually cast to a string, then the filter generated will be != '1', which will have no effect.
            value: value as string 
        }
    } else if (isNumberDtype(columnDtype)) {
        return {
            type: SeriesFilterType.NUMBER_SERIES,
            condition: isNaN ? NumberFilterCondition.NOT_EMPTY : NumberFilterCondition.NUMBER_NOT_EXACTLY,
            value: value as number | string // The NumberFilterType accepts either numbers or strings as the value
        }
    } else if (isDatetimeDtype(columnDtype)) {
        return {
            type: SeriesFilterType.DATETIME_SERIES,
            condition: isNaN ? DatetimeFilterCondition.NOT_EMPTY : DatetimeFilterCondition.DATETIME_NOT_EXTACTLY, 
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
            type: SeriesFilterType.STRING_SERIES,
            condition: StringFilterCondition.CONTAINS,
            value: ''
        }
    }
}

/* 
    A filter is invalid if:
    1. It should have an input, and it does not
    2. It is a number filter with a string input, or with a non-valid number input        
*/
export const isValidFilter = (filter: FilterType): boolean => {
    if (CONDITIONS_WITH_NO_INPUT.includes(filter.condition)) {
        return true;
    }

    if (filter.type === SeriesFilterType.NUMBER_SERIES) {
        return typeof filter.value !== 'string' && !isNaN(filter.value);
    }

    if (filter.type === SeriesFilterType.STRING_SERIES || filter.type === SeriesFilterType.DATETIME_SERIES) {
        return filter.value !== '';
    }

    return true;
}

/* 
    The frontend stores number filters as strings, and so we parse them to
    numbers before sending them to the backend
*/
export const parseFilter = (filter: FilterType): FilterType => {
    if (filter.type === SeriesFilterType.NUMBER_SERIES && typeof filter.value === 'string') {
        return {
            type: filter.type,
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
            if (filterOrGroup.condition === BooleanFilterCondition.IS_FALSE) {
                filteredOutValues.push(true)
            } else if (filterOrGroup.condition === BooleanFilterCondition.IS_TRUE) {
                filteredOutValues.push(false)
            }
        } else {
            // If the condition is a NOT_EXACTLY filter condition then add the value to the list of filtered out values
            // Note: we don't have filter conditions for timedelta series
            if (filterOrGroup.condition === getNotExactlyFilterCondition(columnDtype)) {
                filteredOutValues.push(filterOrGroup.value)
            
            // If the condition is the NOT_EMPTY filter condition (note: all NOT_EMPTY conditions are the same regaurdless of columnMitoType)
            // then add 'NaN' to the list of filtered out values
            } else if (filterOrGroup.condition === StringFilterCondition.NOT_EMPTY) {
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
        return NumberFilterCondition.NUMBER_NOT_EXACTLY
    } else if (isStringDtype(columnDtype)) {
        return StringFilterCondition.STRING_NOT_EXACTLY 
    } else if (isDatetimeDtype(columnDtype)) {
        return DatetimeFilterCondition.DATETIME_NOT_EXTACTLY
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

    return valueOne == valueTwo && filterOne.condition === filterTwo.condition && filterOne.type === filterTwo.type
}

/*
    Helper function for determining if a value is representative of a None value. 
    Because values gets casted all over the codebase, its important that we are able to 
    to detect when values are None so we can treat them the same. 
*/
const isValueNone = (value: string | number | boolean): boolean => {
    return value === 'NaN' || value === 'nan' || value === 'NaT' || value === 'nat' || value === null || value === undefined
}
