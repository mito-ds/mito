/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import { BooleanFilterCondition, DatetimeFilterCondition, NumberFilterCondition, StringFilterCondition } from "../../../../../types"


export const BOOLEAN_SELECT_OPTIONS: Record<BooleanFilterCondition, {'long_name': string, 'short_name': string}> = {
    ['boolean_is_true']: {
        long_name: 'is true',
        short_name: 'is true'
    },
    ['boolean_is_false']: {
        long_name: 'is false',
        short_name: 'is false'
    },
} 

export const NUMBER_SELECT_OPTIONS: Record<NumberFilterCondition, {'long_name': string, 'short_name': string}> = {
    ['number_exactly']: {
        long_name: '=',
        short_name: '='
    },
    ['number_not_exactly']: {
        long_name: '\u2260',
        short_name: '\u2260'
    }, 
    ['greater']: {
        long_name: '\u003E',
        short_name: '\u003E'
    },
    ['greater_than_or_equal']: {
        long_name: '\u2265',
        short_name: '\u2265'
    },
    ['less']: {
        long_name:  '\u003C',
        short_name:  '\u003C'
    },
    ['less_than_or_equal']: {
        long_name:  '\u2264',
        short_name: '\u2264'
    },
    ['number_lowest']: {
        long_name:  'lowest N values',
        short_name: 'lowest N'
    },
    ['number_highest']: {
        long_name:  'highest N values',
        short_name: 'highest N'
    },
} 

export const STRING_SELECT_OPTIONS: Record<StringFilterCondition, {'long_name': string, 'short_name': string}> = {
    ['contains']: {
        long_name: 'string contains',
        short_name: 'contains'
    },
    ['string_does_not_contain']: {
        long_name: 'string does not contain',
        short_name: 'does not contain'
    },
    ['string_exactly']: {
        long_name: 'string is exactly',
        short_name: 'is exactly'
    },
    ['string_not_exactly']: {
        long_name: 'string is not exactly',
        short_name: 'is not exactly'
    },
    ['string_starts_with']: {
        long_name: 'string starts with',
        short_name: 'starts with'
    },
    ['string_ends_with']: {
        long_name: 'string ends with',
        short_name: 'ends with'
    },
    ['string_contains_case_insensitive']: {
        long_name: 'string contains case insensitive',
        short_name: 'contains case insensitive'
    }
} 

export const DATETIME_SELECT_OPTIONS: Record<DatetimeFilterCondition, {'long_name': string, 'short_name': string}> = {
    ['datetime_exactly']: {
        long_name: 'date is exactly',
        short_name: '='
    },
    ['datetime_not_exactly']: {
        long_name: 'date is not exactly',
        short_name: '!='
    },
    ['datetime_greater']: {
        long_name: 'date is after',
        short_name: '\u003E'
    },
    ['datetime_greater_than_or_equal']: {
        long_name: 'date is exactly or after',
        short_name: '\u2265'
    },
    ['datetime_less']: {
        long_name: 'date is before',
        short_name: '\u003C'
    },
    ['datetime_less_than_or_equal']: {
        long_name: 'date is exactly or before',
        short_name: '\u2264'
    },
} 

export const SHARED_SELECT_OPTIONS: Record<string, {'long_name': string, 'short_name': string}> = {
    ['empty']: {
        long_name: 'is empty',
        short_name: 'is empty'
    },
    ['not_empty']: {
        long_name: 'is not empty',
        short_name: 'is not empty'
    },
    ['most_frequent']: {
        long_name: 'most frequent N values',
        short_name: 'most frequent N'
    },
    ['least_frequent']: {
        long_name: 'least frequent N values',
        short_name: 'least frequent N'
    }
} 

export const ALL_SELECT_OPTIONS: Record<string, Record<string, string>> = {
    ...BOOLEAN_SELECT_OPTIONS,
    ...NUMBER_SELECT_OPTIONS,
    ...STRING_SELECT_OPTIONS,
    ...DATETIME_SELECT_OPTIONS,
    ...SHARED_SELECT_OPTIONS
}

export const CONDITIONS_WITH_NO_INPUT = [
    'boolean_is_true',
    'boolean_is_false',
    'empty',
    'not_empty',
]