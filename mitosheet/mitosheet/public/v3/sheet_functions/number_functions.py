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
from typing import Union
import sys
import numpy as np

import pandas as pd

from mitosheet.public.v3.errors import handle_sheet_function_errors
from mitosheet.public.v3.rolling_range import RollingRange
from mitosheet.public.v3.sheet_functions.utils import get_final_result_series_or_primitive
from mitosheet.public.v3.types.decorators import cast_values_in_all_args_to_type
from mitosheet.public.v3.types.sheet_function_types import NumberFunctionReturnType, NumberInputType

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