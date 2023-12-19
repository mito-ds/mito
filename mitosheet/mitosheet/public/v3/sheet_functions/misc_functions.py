
from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd

from mitosheet.errors import MitoError
from mitosheet.is_type_utils import (is_bool_dtype, is_datetime_dtype,
                                     is_float_dtype, is_int_dtype,
                                     is_string_dtype)
from mitosheet.public.v3.errors import handle_sheet_function_errors
from mitosheet.public.v3.sheet_functions.utils import \
    get_series_from_primitive_or_series
from mitosheet.public.v3.types.decorators import cast_values_in_arg_to_type
from mitosheet.public.v3.types.sheet_function_types import (
    AnyPrimitiveOrSeriesInputType, BoolRestrictedInputType,
    IntRestrictedInputType)


@handle_sheet_function_errors
def FILLNAN(series: pd.Series, replacement: AnyPrimitiveOrSeriesInputType) -> pd.Series:
    """
    {
        "function": "FILLNAN",
        "description": "Replaces the NaN values in the series with the replacement value.",
        "search_terms": ["fillnan", "nan", "fill nan", "missing values", "null", "null value", "fill null"],
        "examples": [
            "FILLNAN(A, 10)",
            "FILLNAN(A, 'replacement')"
        ],
        "syntax": "FILLNAN(series, replacement)",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to replace the NaN values in."
            },
            {
                "element": "replacement",
                "description": "A string, number, or date to replace the NaNs with."
            }
        ]
    }
    """
    return series.fillna(replacement)


@handle_sheet_function_errors
def TYPE(series: pd.Series) -> pd.Series:
    """
    {
        "function": "TYPE",
        "description": "Returns the type of each element of the passed series. Return values are 'number', 'str', 'bool', 'datetime', 'object', or 'NaN'.",
        "search_terms": ["type", "dtype"],
        "examples": [
            "TYPE(Nums_and_Strings)",
            "IF(TYPE(Account_Numbers) != 'NaN', Account_Numbers, 0)"
        ],
        "syntax": "TYPE(series)",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to get the type of each element of."
            }
        ]
    }
    """

    def get_element_type(element):
        # Start with bool!
        if isinstance(element, bool):
            return 'bool'
        elif isinstance(element, int):
            return 'number'
        elif isinstance(element, float):
            if np.isnan(element):
                return 'NaN'
            return 'number'
        elif element is None or element is pd.NaT:
            return 'NaN'
        elif isinstance(element, str):
            return 'string'
        elif isinstance(element, datetime) or isinstance(element, pd.Timestamp):
            return 'datetime'
        elif isinstance(element, timedelta) or isinstance(element, pd.Timedelta):
            return 'timedelta'
        return 'object'

    return series.apply(get_element_type).astype('str')



@handle_sheet_function_errors
def GETPREVIOUSVALUE(series: pd.Series, condition: BoolRestrictedInputType) -> pd.Series:
    """
    {
        "function": "GETPREVIOUSVALUE",
        "description": "Returns the value from series that meets the condition.",
        "search_terms": ["ffill"],
        "examples": [
            "GETPREVIOUSVALUE(Max_Balances, Max_Balances > 0)"
        ],
        "syntax": "GETPREVIOUSVALUE(series, condition)",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to get the previous value from."
            }, {
                "element": "condition",
                "description": "When condition is True, a new previous value is set, and carried forward until the condition is True again."
            }
        ]
    }
    """
    # Default to a different last occurence depending on the type
    column_dtype = str(series.dtype)
    last_occurrence: Any = -1
    if is_int_dtype(column_dtype) or is_float_dtype(column_dtype):
        last_occurrence = -1
    elif is_string_dtype(column_dtype):
        last_occurrence = ''
    elif is_bool_dtype(column_dtype):
        last_occurrence = False
    elif is_datetime_dtype(column_dtype):
        last_occurrence = pd.NaT

    condition = get_series_from_primitive_or_series(condition, series.index)

    result = []
    for index, value in condition.items():
        if value:
            last_occurrence = series[index]
        result.append(last_occurrence)

    return pd.Series(result, index=series.index)

@handle_sheet_function_errors
def GETNEXTVALUE(series: pd.Series, condition: BoolRestrictedInputType) -> pd.Series:
    """
    {
        "function": "GETNEXTVALUE",
        "description": "Returns the next value from series that meets the condition.",
        "search_terms": ["ffill"],
        "examples": [
            "GETNEXTVALUE(Max_Balances, Max_Balances > 0)"
        ],
        "syntax": "GETNEXTVALUE(series, condition)",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to get the next value from."
            }, {
                "element": "condition",
                "description": "When condition is True, a new previous value is set, and carried backwards until the condition is True again."
            }
        ]
    }
    """
    reversed_series = series[::-1]
    condition = get_series_from_primitive_or_series(condition, series.index)
    reversed_condition = condition[::-1]

    return GETPREVIOUSVALUE(reversed_series, reversed_condition)[::-1]

@cast_values_in_arg_to_type('index', 'int')
def VLOOKUP(lookup_value: AnyPrimitiveOrSeriesInputType, where: pd.DataFrame, index: IntRestrictedInputType) -> pd.Series:
    """
    {
        "function": "VLOOKUP",
        "description": "Looks up a value in a range and returns the value in the same row from a column you specify.",
        "search_terms": ["vlookup", "merge", "join", "search", "lookup"],
        "category": "REFERENCE",
        "examples": [
            "VLOOKUP(Names0, Ids:Ages, 1)",
            "VLOOKUP('John Smith', Names:Ages, 2)",
            "VLOOKUP(Names0, Ids:Ages, Column Indexes0)"
        ],
        "syntax": "VLOOKUP(lookup_value, where, index)",
        "syntax_elements": [{
                "element": "lookup_value",
                "description": "The value to look up."
            }, {
                "element": "where",
                "description": "The range to look up in."
            }, {
                "element": "index",
                "description": "The column index to return."
            }
        ]
    }
    """
    where_first_column_case_insensitive = where.iloc[:,0].copy()
    where_first_column_case_insensitive.name = str(where_first_column_case_insensitive.name) + 'MITO_CASE_INSENSITIVE'

    # If the lookup value and index are both a primitive, we don't need to merge. 
    if not isinstance(lookup_value, pd.Series) and isinstance(index, int):
        if type(lookup_value) != type(where.iloc[0,0]):
            raise MitoError(
                'invalid_args_error',
                'VLOOKUP',
                f'VLOOKUP requires the lookup value and the first column of the where range to be the same type. The lookup value is of type {type(lookup_value)} and the first column of the where range is of type {type(where.iloc[0,0])}.'
            )

        # If the lookup value and the first column are strings, make them lowecase for case-insensitive matching
        if isinstance(lookup_value, str) and isinstance(where.iloc[0,0], str):
            lookup_value = lookup_value.lower()
            where_first_column_case_insensitive = where_first_column_case_insensitive.str.lower()

        matching_row = where.loc[where_first_column_case_insensitive == lookup_value]
        if matching_row.empty:
            return None
        else:
            return matching_row.iloc[0, index-1]

    value = get_series_from_primitive_or_series(lookup_value, where.index)

    value.name = 'lookup_value'
    indices_to_return_from_range = get_series_from_primitive_or_series(index, value.index)

    # If the lookup value and the first column of the where range are different types, we raise an error
    if value.dtype != where_first_column_case_insensitive.dtype:
        raise MitoError(
            'invalid_args_error',
            'VLOOKUP',
            f'VLOOKUP requires the lookup value and the first column of the where range to be the same type. The lookup value is of type {value.dtype} and the first column of the where range is of type {where_first_column_case_insensitive.dtype}.'
        )

    # If the series is a string, convert it to lowercase because Excel's vlookup is case insensitive
    if is_string_dtype(str(value.dtype)):
        value = value.str.lower()
        where_first_column_case_insensitive = where_first_column_case_insensitive.str.lower()

    # Add where_first_column_case_insensitive to the front of the dataframe so we can use the case insensitive merge 
    # without effecting the return values
    where = pd.concat([where_first_column_case_insensitive, where], axis=1)
    indices_to_return_from_range = indices_to_return_from_range + 1

    where_deduplicated = where.drop_duplicates(subset=where_first_column_case_insensitive.name)
    
    # Update first column to use the deduplicated version
    where_first_column = where_deduplicated.iloc[:,0]
    
    # Then merge on the column we're looking up from, and the df we're looking up in.
    merged = pd.merge(value, where_deduplicated, left_on='lookup_value', right_on=where_first_column, how='left')

    # Change the indexes back to the indexes of the lookup value so the results 
    # can be added back to the calling dataframe.
    merged.index = value.index
    
    def get_value_at_index_in_row(row):
        try:
            return row.iloc[indices_to_return_from_range[row.name]]
        # Because we can't control what the user puts in the index, we need to catch any errors
        except Exception:
            return None
    return merged.apply(get_value_at_index_in_row, axis=1)

# TODO: we should see if we can list these automatically!
MISC_FUNCTIONS = {
    'FILLNAN': FILLNAN,
    'GETPREVIOUSVALUE': GETPREVIOUSVALUE,
    'GETNEXTVALUE': GETNEXTVALUE,
    'TYPE': TYPE,
    'VLOOKUP': VLOOKUP
}