
from datetime import datetime, timedelta
import numpy as np
from typing import Any

import pandas as pd
from mitosheet.is_type_utils import is_bool_dtype, is_datetime_dtype, is_float_dtype, is_int_dtype, is_string_dtype

from mitosheet.public.v3.errors import handle_sheet_function_errors
from mitosheet.public.v3.sheet_functions.utils import get_series_from_primitive_or_series
from mitosheet.public.v3.types.sheet_function_types import AnyPrimitiveOrSeriesInputType, BoolRestrictedInputType


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


# TODO: we should see if we can list these automatically!
MISC_FUNCTIONS = {
    'FILLNAN': FILLNAN,
    'GETPREVIOUSVALUE': GETPREVIOUSVALUE,
    'GETNEXTVALUE': GETNEXTVALUE,
    'TYPE': TYPE,
}