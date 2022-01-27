// Copyright (c) Mito

import { BooleanFilterCondition, ColumnMitoType, DatetimeFilterCondition, NumberFilterCondition, StringFilterCondition } from "../../../../../types"


const BOOLEAN_SELECT_OPTIONS: Record<string, string> = {
    [BooleanFilterCondition.IS_TRUE]: 'is true',
    [BooleanFilterCondition.IS_FALSE]: 'is false',
    [BooleanFilterCondition.EMPTY]: 'is empty',
    [BooleanFilterCondition.NOT_EMPTY]: 'is not empty'
} 

const NUMBER_SELECT_OPTIONS: Record<string, string> = {
    [NumberFilterCondition.NUMBER_EXACTLY]: '=',
    [NumberFilterCondition.NUMBER_NOT_EXACTLY]: '\u2260',
    [NumberFilterCondition.GREATER]: '\u003E',
    [NumberFilterCondition.GREATER_THAN_OR_EQUAL]: '\u2265',
    [NumberFilterCondition.LESS]: '\u003C',
    [NumberFilterCondition.LESS_THAN_OR_EQUAL]: '\u2264',
    [NumberFilterCondition.EMPTY]: 'is empty',
    [NumberFilterCondition.NOT_EMPTY]: 'is not empty'
} 

const STRING_SELECT_OPTIONS: Record<string, string> = {
    [StringFilterCondition.CONTAINS]: 'contains',
    [StringFilterCondition.DOES_NOT_CONTAIN]: 'does not contain',
    [StringFilterCondition.STRING_EXACTLY]: 'is exactly',
    [StringFilterCondition.STRING_NOT_EXACTLY]: 'is not exactly',
    [StringFilterCondition.EMPTY]: 'is empty',
    [StringFilterCondition.NOT_EMPTY]: 'is not empty'
} 

const DATETIME_SELECT_OPTIONS: Record<string, string> = {
    [DatetimeFilterCondition.DATETIME_EXTACTLY]: '=',
    [DatetimeFilterCondition.DATETIME_NOT_EXTACTLY]: '!=',
    [DatetimeFilterCondition.DATETIME_GREATER_THAN]: '\u003E',
    [DatetimeFilterCondition.DATETIME_GREATER_THAN_OR_EQUAL]: '\u2265',
    [DatetimeFilterCondition.DATETIME_LESS]: '\u003C',
    [DatetimeFilterCondition.DATETIME_LESS_THAN_OR_EQUAL]: '\u2264',
    [DatetimeFilterCondition.EMPTY]: 'is empty',
    [DatetimeFilterCondition.NOT_EMPTY]: 'is not empty'
} 

export const COLUMN_TYPE_TO_SELECT_OPTIONS: Record<ColumnMitoType, Record<string, string>> = {
    [ColumnMitoType.BOOLEAN_SERIES]: BOOLEAN_SELECT_OPTIONS,
    [ColumnMitoType.STRING_SERIES]: STRING_SELECT_OPTIONS,
    [ColumnMitoType.NUMBER_SERIES]: NUMBER_SELECT_OPTIONS,
    [ColumnMitoType.DATETIME_SERIES]: DATETIME_SELECT_OPTIONS,
    // We don't have time delta filters yet, so we just default to string options
    [ColumnMitoType.TIMEDELTA_SERIES]: STRING_SELECT_OPTIONS,

}

export const CONDITIONS_WITH_NO_INPUT = [
    BooleanFilterCondition.IS_TRUE,
    BooleanFilterCondition.IS_FALSE,
    BooleanFilterCondition.EMPTY,
    BooleanFilterCondition.NOT_EMPTY,
    NumberFilterCondition.EMPTY,
    NumberFilterCondition.NOT_EMPTY,
    StringFilterCondition.EMPTY,
    StringFilterCondition.NOT_EMPTY,
    DatetimeFilterCondition.EMPTY,
    DatetimeFilterCondition.NOT_EMPTY,
]