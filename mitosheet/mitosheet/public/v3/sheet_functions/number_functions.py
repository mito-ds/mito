#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all functions that can be used in a sheet that operate on
numbers.

All functions describe their behavior with a function documentation object
in the function docstring. Function documentation objects are described
in more detail in docs/README.md.

NOTE: This file is alphabetical order!
"""
import math
from typing import Union
import sys
import numpy as np

import pandas as pd

from mitosheet.public.v3.errors import handle_sheet_function_errors
from mitosheet.public.v3.rolling_range import RollingRange
from mitosheet.public.v3.sheet_functions.utils import get_args_as_series_if_any_is_series, get_final_result_series_or_primitive
from mitosheet.public.v3.types.decorators import cast_values_in_all_args_to_type, cast_values_in_arg_to_type
from mitosheet.public.v3.types.sheet_function_types import FloatFunctonReturnType, IntFunctionReturnType, IntRestrictedInputType, NumberFunctionReturnType, NumberInputType, NumberRestrictedInputType

@cast_values_in_arg_to_type('series', 'number')
@handle_sheet_function_errors
def ABS(series: NumberRestrictedInputType) -> NumberFunctionReturnType:
    """
    {
        "function": "ABS",
        "description": "Returns the absolute value of the passed number or series.",
        "search_terms": ["abs", "absolute value"],
        "examples": [
            "ABS(-1.3)",
            "ABS(A)"
        ],
        "syntax": "ABS(value)",
        "syntax_elements": [{
                "element": "value",
                "description": "The value or series to take the absolute value of."
            }
        ]
    }
    """
    if series is None:
        return 0
    elif isinstance(series, int) or isinstance(series, float):
        return abs(series)

    return series.abs()


@cast_values_in_all_args_to_type('number')
@handle_sheet_function_errors
def AVG(*argv: NumberInputType) -> NumberFunctionReturnType:

    # Calculate the sum using the SUM function
    sum_for_avg = SUM(*argv)

    # Then, we count the number of entries in the arguements. To match Excel's behavior, we do not count 
    # nan values, and we do not count when a RollingRange runs off the end of the sum
    num_entries: Union[pd.Series,int] = 0

    for arg in argv:
        if isinstance(arg, pd.DataFrame):
            num_non_null_values = arg.count().sum()
            num_entries += num_non_null_values

        elif isinstance(arg, RollingRange):
            num_non_null_values_series = arg.apply(lambda df: df.count().sum())
            num_entries += num_non_null_values_series
            
        elif isinstance(arg, pd.Series):
            # Because series are summed row-wise, we need to count the number of non-null
            # values in the row, which we do with this little type cast
            num_entries += (~arg.isna()).astype(int)
            
        elif arg is not None:
            num_entries += 1

    return sum_for_avg / num_entries if num_entries is not 0 else 0

@cast_values_in_arg_to_type('series', 'number')
@handle_sheet_function_errors
def FLOAT(series: NumberRestrictedInputType) -> FloatFunctonReturnType:
    """
    {
        "function": "FLOAT",
        "description": "Converts a string series to a float series. Any values that fail to convert will return NaN.",
        "search_terms": ["number", "to number"],
        "examples": [
            "=FLOAT(Prices_string)",
            "=FLOAT('123.123')"
        ],
        "syntax": "FLOAT(string_series)",
        "syntax_elements": [{
                "element": "string_series",
                "description": "The series or string to convert to a float."
            }
        ]
    }
    """
    if series is None:
        return 0
    elif isinstance(series, int) or isinstance(series, float):
        return float(series)
    return series

@cast_values_in_arg_to_type('series', 'number')
@handle_sheet_function_errors
def INT(series: NumberRestrictedInputType) -> IntFunctionReturnType:
    """
    {
        "function": "INT",
        "description": "Converts a string series to a int series. Any values that fail to convert will return 0.",
        "search_terms": ["number", "to integer"],
        "examples": [
            "=INT(Prices_string)",
            "=INT('123')"
        ],
        "syntax": "INT(string_series)",
        "syntax_elements": [{
                "element": "string_series",
                "description": "The series or string to convert to a int."
            }
        ]
    }
    """
    if series is None:
        return 0
    elif isinstance(series, int) or isinstance(series, float):
        return int(series)
    return series
    

@cast_values_in_arg_to_type('series', 'number')
@cast_values_in_arg_to_type('base', 'number')
@handle_sheet_function_errors
def LOG(series: NumberRestrictedInputType, base: NumberRestrictedInputType=None) -> NumberFunctionReturnType:
    """
    {
        "function": "LOG",
        "description": "Calculates the logarithm of the passed series with an optional base.",
        "search_terms": ["log", "logarithm", "natural log"],
        "examples": [
            "LOG(e) = 1",
            "LOG(100, 10) = 2"
        ],
        "syntax": "LOG(series, [base])",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to take the logarithm of."
            },
            {
                "element": "base [OPTIONAL]",
                "description": "The base of the logarithm to use. Defaults to the natural logarithm if no base is passed."
            }
        ]
    }
    """
    if series is None:
        return 0
    elif base is None:
        return np.log(series)
    
    # See here: https://stackoverflow.com/questions/25169297/numpy-logarithm-with-base-n
    return np.log(series) / np.log(base)

@cast_values_in_all_args_to_type('number')
@handle_sheet_function_errors
def MAX(*argv: NumberInputType) -> NumberFunctionReturnType:
    
    result = get_final_result_series_or_primitive(
        -sys.maxsize - 1,
        argv,
        lambda df: df.sum().sum(),
        lambda previous_value, new_value: max(previous_value, new_value),
        lambda previous_series, new_series: pd.concat([previous_series, new_series], axis=1).max(axis=1)
    )

    # If we don't find any arguements, we default to 0 -- like Excel
    kept_default_max_value = not isinstance(result, pd.Series) and result == (-sys.maxsize - 1)
    return result if not kept_default_max_value else 0


@cast_values_in_all_args_to_type('number')
@handle_sheet_function_errors
def MIN(*argv: NumberInputType) -> NumberFunctionReturnType:

    result = get_final_result_series_or_primitive(
        sys.maxsize,
        argv,
        lambda df: df.sum().sum(),
        lambda previous_value, new_value: min(previous_value, new_value),
        lambda previous_series, new_series: pd.concat([previous_series, new_series], axis=1).min(axis=1)
    )

    # If we don't find any arguements, we default to 0 -- like Excel
    kept_default_min_value = not isinstance(result, pd.Series) and result == sys.maxsize
    return result if not kept_default_min_value else 0


@cast_values_in_all_args_to_type('number')
@handle_sheet_function_errors
def MULTIPLY(*argv: NumberInputType) -> NumberFunctionReturnType:

    return get_final_result_series_or_primitive(
        1,
        argv,
        lambda df: df.prod().prod(),
        lambda previous_value, new_value: previous_value * new_value,
        lambda previous_series, new_series: previous_series * new_series
    )


@cast_values_in_arg_to_type('series', 'number')
@cast_values_in_arg_to_type('power', 'number')
@handle_sheet_function_errors
def POWER(series: NumberRestrictedInputType, power: NumberRestrictedInputType) -> NumberFunctionReturnType:
    """
    {
        "function": "POWER",
        "description": "The POWER function can be used to raise a number to a given power.",
        "search_terms": ["power", "raise", "exponent", "square", "cube"],
        "examples": [
            "POWER(4, 1/2)",
            "POWER(Dose, 2)"
        ],
        "syntax": "POWER(value, exponent)",
        "syntax_elements": [{
                "element": "value",
                "description": "Number to raise to a power."
            },
            {
                "element": "exponent",
                "description": "The number to raise value to."
            }
        ]
    }
    """
    if series is None:
        return 0
    elif power is None:
        return series
    elif isinstance(series, int) or isinstance(series, float):
        return series ** power
    
    return series.pow(power)

@cast_values_in_arg_to_type('series', 'number')
@cast_values_in_arg_to_type('decimals', 'number')
@handle_sheet_function_errors
def ROUND(series: NumberRestrictedInputType, decimals: IntRestrictedInputType=None) -> NumberFunctionReturnType:
    """
    {
        "function": "ROUND",
        "description": "Rounds a number to a given number of decimals.",
        "search_terms": ["round", "decimal", "integer"],
        "examples": [
            "ROUND(1.3)",
            "ROUND(A, 2)"
        ],
        "syntax": "ROUND(value, [decimals])",
        "syntax_elements": [{
                "element": "value",
                "description": "The value or series to round."
            },
            {
                "element": "decimals",
                "description": " The number of decimals to round to. Default is 0."
            }
        ]
    }
    """

    if series is None:
        return 0

    # If no decimals option is passed, round to no decimals
    if decimals is None:
        decimals = 0

    _series, _decimals = get_args_as_series_if_any_is_series(series, decimals)

    if isinstance(_series, pd.Series) and isinstance(_decimals, pd.Series):
        return pd.Series(
            [round(num, dec) for num, dec in zip(_series, _decimals)],
            index=_series.index
        )
    else:
        return round(_series, _decimals)
    

@cast_values_in_all_args_to_type('number')
@handle_sheet_function_errors
def SUM(*argv: NumberInputType) -> NumberFunctionReturnType:

    return get_final_result_series_or_primitive(
        0,
        argv,
        lambda df: df.sum().sum(),
        lambda previous_value, new_value: previous_value + new_value,
        lambda previous_series, new_series: previous_series + new_series
    )



# TODO: we should see if we can list these automatically!
NUMBER_FUNCTIONS = {
    'AVG': AVG,
    'MAX': MAX,
    'MIN': MIN,
    'MULTIPLY': MULTIPLY,
    'SUM': SUM,
}