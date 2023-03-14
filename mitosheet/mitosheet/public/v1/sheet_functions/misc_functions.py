#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all functions that don't particularly fit in any other category

All functions describe their behavior with a function documentation object
in the function docstring. Function documentation objects are described
in more detail in docs/README.md.

NOTE: This file is alphabetical order!
"""
from typing import Any
import pandas as pd
import numpy as np
import datetime
from mitosheet.is_type_utils import is_bool_dtype, is_datetime_dtype, is_float_dtype, is_int_dtype, is_string_dtype

from mitosheet.public.v1.sheet_functions.sheet_function_utils import try_extend_series_to_index
from mitosheet.public.v1.sheet_functions.types.decorators import filter_nans, convert_arg_to_series_type, handle_sheet_function_errors


@handle_sheet_function_errors
@convert_arg_to_series_type(
    0,
    'series',
    'error',
    'error'
)
@convert_arg_to_series_type(
    1,
    'series',
    'error',
    'error'
)
def FILLNAN(series: pd.Series, replacement: pd.Series) -> pd.Series:
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
    # Make sure the replacement series is long enough
    replacement = try_extend_series_to_index(replacement, series.index)

    return series.fillna(replacement)


@handle_sheet_function_errors
@convert_arg_to_series_type(
    0,
    'series',
    'error',
    'error'
)
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
        try:
            # Try nan first, this may fail
            if np.isnan(element):
                return 'NaN'
        except:
            pass 

        # Start with bool!
        if isinstance(element, bool):
            return 'bool'
        elif isinstance(element, int):
            return 'number'
        elif isinstance(element, float):
            return 'number'
        elif isinstance(element, str):
            return 'string'
        elif isinstance(element, datetime.datetime):
            return 'datetime'
        elif isinstance(element, pd.Timedelta):
            return 'timedelta'
        return 'object'

    return series.apply(get_element_type).astype('str')



@handle_sheet_function_errors
@convert_arg_to_series_type(
    0,
    'series',
    'error',
    'error'
)
@convert_arg_to_series_type(
    1,
    'bool', 
    'error', 
    ('default', True)
)
def GETPREVIOUSVALUE(series: pd.Series, condition: pd.Series) -> pd.Series:
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

    result = []
    for index, value in condition.items():
        if value:
            last_occurrence = series[index]
        result.append(last_occurrence)

    return pd.Series(result, index=series.index)


# TODO: we should see if we can list these automatically!
MISC_FUNCTIONS = {
    'FILLNAN': FILLNAN,
    'GETPREVIOUSVALUE': GETPREVIOUSVALUE,
    'TYPE': TYPE,
}