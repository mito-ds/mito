// Copyright (c) Mito

import { BooleanFilterCondition, DatetimeFilterCondition, NumberFilterCondition, StringFilterCondition } from "../../../../../types"


export const BOOLEAN_SELECT_OPTIONS: Record<BooleanFilterCondition, string> = {
    ['boolean_is_true']: 'is true',
    ['boolean_is_false']: 'is false',
    ['empty']: 'is empty',
    ['not_empty']: 'is not empty'
} 

export const NUMBER_SELECT_OPTIONS: Record<NumberFilterCondition, string> = {
    ['number_exactly']: '=',
    ['number_not_exactly']: '\u2260',
    ['greater']: '\u003E',
    ['greater_than_or_equal']: '\u2265',
    ['less']: '\u003C',
    ['less_than_or_equal']: '\u2264',
    ['empty']: 'is empty',
    ['not_empty']: 'is not empty'
} 

export const STRING_SELECT_OPTIONS: Record<StringFilterCondition, string> = {
    ['contains']: 'contains',
    ['string_does_not_contain']: 'does not contain',
    ['string_exactly']: 'is exactly',
    ['string_not_exactly']: 'is not exactly',
    ['empty']: 'is empty',
    ['not_empty']: 'is not empty'
} 

export const DATETIME_SELECT_OPTIONS: Record<DatetimeFilterCondition, string> = {
    ['datetime_exactly']: '=',
    ['datetime_not_exactly']: '!=',
    ['datetime_greater']: '\u003E',
    ['datetime_greater_than_or_equal']: '\u2265',
    ['datetime_less']: '\u003C',
    ['datetime_less_than_or_equal']: '\u2264',
    ['empty']: 'is empty',
    ['not_empty']: 'is not empty'
} 

export const CONDITIONS_WITH_NO_INPUT = [
    'boolean_is_true',
    'boolean_is_false',
    'empty',
    'not_empty',
]