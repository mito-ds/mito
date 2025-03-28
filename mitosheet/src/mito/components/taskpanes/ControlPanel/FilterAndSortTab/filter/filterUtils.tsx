/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';
import { FilterType, FilterGroupType, StringValueFilterType } from '../../../../../types';
import { isBoolDtype, isDatetimeDtype, isNumberDtype, isStringDtype, isTimedeltaDtype } from '../../../../../utils/dtypes';
import DropdownItem from '../../../../elements/DropdownItem';
import DropdownSectionSeperator from '../../../../elements/DropdownSectionSeperator';
import { BOOLEAN_SELECT_OPTIONS, CONDITIONS_WITH_NO_INPUT, DATETIME_SELECT_OPTIONS, NUMBER_SELECT_OPTIONS, SHARED_SELECT_OPTIONS, STRING_SELECT_OPTIONS } from './filterConditions';
import { isFilterGroup } from './filterTypes';

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
            condition: 'not_empty',
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

export const checkFilterShouldHaveNumberValue = (filter: FilterType): filter is StringValueFilterType => {
    return ((Object.keys(NUMBER_SELECT_OPTIONS).includes(filter.condition) || filter.condition === 'most_frequent' || filter.condition === 'least_frequent')
                            && typeof filter.value === 'string')
}

/* 
    A filter is invalid if:
    1. It should have an input, and it does not
    2. It is a number filter with a string input, or with a non-valid number input        
*/
const isValidFilter = (filter: FilterType, columnDtype: string): boolean => {
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
const parseFilter = (filter: FilterType): FilterType => {
    if (checkFilterShouldHaveNumberValue(filter)) {
        return {
            condition: filter.condition,
            value: parseFloat(filter.value)
        }
    }
    return filter;
}

/**
 *  Given filters that are stored in the frontend, this function parses the filters, removes
 *  any filters that cannot be parsed or are invalid, and gets them ready to be sent to the 
 *  backend.
 */
export const getFiltersToApply = (filters: (FilterType | FilterGroupType)[], columnDtype: string): (FilterType | FilterGroupType)[] => {
    // To handle decimals, we allow decimals to be submitted, and then just
    // parse them before they are sent to the back-end
    const parsedFilters: (FilterType | FilterGroupType)[] = filters.map((filterOrGroup): FilterType | FilterGroupType => {
        if (isFilterGroup(filterOrGroup)) {
            return {
                filters: filterOrGroup.filters.map((filter) => {
                    return parseFilter(filter);
                }),
                operator: filterOrGroup.operator
            }
        } else {
            return parseFilter(filterOrGroup)
        }
    })

    const filtersToApply: (FilterType | FilterGroupType)[] = parsedFilters.map((filterOrGroup): FilterType | FilterGroupType => {
        // Filter out these incomplete filters from the group
        if (isFilterGroup(filterOrGroup)) {
            return {
                filters: filterOrGroup.filters.filter((filter) => {
                    return isValidFilter(filter, columnDtype)
                }),
                operator: filterOrGroup.operator
            }
        } else {
            return filterOrGroup
        }
    }).filter((filterOrGroup) => {
        // Filter out the groups if they have no valid filters in them
        if (isFilterGroup(filterOrGroup)) {
            return filterOrGroup.filters.length > 0;
        }
        // And then we filter the non group filters to be non-empty
        return isValidFilter(filterOrGroup, columnDtype)
    });

    return filtersToApply;
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
export const isValueNone = (value: string | number | boolean): boolean => {
    return value === 'NaN' || value === 'nan' || value === 'NaT' || value === 'nat' || value === null || value === undefined
}



const addToFilterOptions = (prevFilterOptions: JSX.Element[], newOptions: Record<string, Record<string, string>>, name: `long_name` | 'short_name'): JSX.Element[] => {
    const newFilterOptions = [...prevFilterOptions];

    Object.entries(newOptions).forEach(([filterCondition, displayFilterCondition]) => {
        newFilterOptions.push(
            <DropdownItem
                key={filterCondition}
                id={filterCondition}
                title={displayFilterCondition[name]}
            />
        )
    });

    return newFilterOptions;
}

export const getFilterOptions = (columnDtype: string | undefined, nameLength: 'long_name' | 'short_name'): JSX.Element[] => {
    let filterOptions: JSX.Element[] = [];

    if (!columnDtype || isNumberDtype(columnDtype)) {
        filterOptions = addToFilterOptions(filterOptions, NUMBER_SELECT_OPTIONS, nameLength);
        filterOptions.push(<DropdownSectionSeperator isDropdownSectionSeperator/>)
    }

    if (!columnDtype || isStringDtype(columnDtype)) {
        filterOptions = addToFilterOptions(filterOptions, STRING_SELECT_OPTIONS, nameLength);
        filterOptions.push(<DropdownSectionSeperator isDropdownSectionSeperator/>)
    }
    
    if (!columnDtype || isBoolDtype(columnDtype)) {
        filterOptions = addToFilterOptions(filterOptions, BOOLEAN_SELECT_OPTIONS, nameLength);
        filterOptions.push(<DropdownSectionSeperator isDropdownSectionSeperator/>)
    } 
    
    if (!columnDtype || isDatetimeDtype(columnDtype)) {
        filterOptions = addToFilterOptions(filterOptions, DATETIME_SELECT_OPTIONS, nameLength);
        filterOptions.push(<DropdownSectionSeperator isDropdownSectionSeperator/>)
    }

    filterOptions = addToFilterOptions(filterOptions, SHARED_SELECT_OPTIONS, nameLength);

    return filterOptions;
}

/**
 * Returns the appropriate filter condition for the given column dtype and value
 * @param columnDtype - column dtype for cell
 * @param value - cell value
 * @returns a filter condition
 */
export const getEqualityFilterCondition = (value: any, columnDtype?: string): string => {
    const isNaN = value === undefined || isValueNone(value)
    let condition = 'string_exactly';
    if (columnDtype === 'number') {
        condition = 'number_exactly';
    } else if (columnDtype === 'boolean') {
        condition = value ? 'boolean_is_true' : 'boolean_is_false';
    } else if (columnDtype === 'datetime') {
        condition = 'datetime_exactly';
    }
    if (isNaN) {
        condition = 'empty'
    }
    return condition;
}