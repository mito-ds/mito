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

from mitosheet.public.v3.rolling_range import RollingRange
from mitosheet.public.v3.types.decorators import cast_values_in_arg_to_type

NumberFunctionReturnType = Union[pd.Series, int, float]

@cast_values_in_arg_to_type('number')
def AVG(*argv: Union[int, float, None, pd.Series, RollingRange]) -> NumberFunctionReturnType:

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


@cast_values_in_arg_to_type('number')
def MAX(*argv: Union[int, float, None, pd.Series, RollingRange]) -> NumberFunctionReturnType:
    
    result: Union[pd.Series, float, int] = -sys.maxsize - 1

    def get_new_result(_result: Union[pd.Series, float, int], new_value: Union[pd.Series, float, int]) -> Union[pd.Series, float, int]:
        if isinstance(_result, pd.Series):
            if isinstance(new_value, pd.Series):
                return pd.concat([_result, new_value], axis=1).max(axis=1)
            else:
                return _result.apply(lambda v: np.nanmax([v, new_value]))
        else:
            if isinstance(new_value, pd.Series):
                return new_value.apply(lambda v: np.nanmax([v, _result]))
            else:
                return max(_result, new_value)

    for arg in argv:
        if isinstance(arg, pd.DataFrame):
            df_sum = arg.sum().sum()
            result = get_new_result(result, df_sum)

        elif isinstance(arg, RollingRange):
            new_series = arg.apply(lambda df: df.sum().sum())
            result = get_new_result(result, new_series)
            
        elif isinstance(arg, pd.Series):
            result = get_new_result(result, arg)
            
        elif arg is not None:
            result = get_new_result(result, arg)

    # If we don't find any arguements, we default to 0 -- like Excel
    kept_default_min_value = not isinstance(result, pd.Series) and result == (-sys.maxsize - 1)
    return result if not kept_default_min_value else 0

@cast_values_in_arg_to_type('number')
def SUM(*argv: Union[int, float, None, pd.Series, RollingRange]) -> NumberFunctionReturnType:
    
    result: Union[pd.Series, float, int] = 0

    for arg in argv:

        if isinstance(arg, pd.DataFrame):
            result += arg.sum().sum()
        elif isinstance(arg, RollingRange):
            result += arg.apply(lambda df: df.sum().sum())
        elif isinstance(arg, pd.Series):
            result += arg.fillna(0)
        elif arg is not None:
            result += arg

    return result 



# TODO: we should see if we can list these automatically!
NUMBER_FUNCTIONS = {
    'AVG': AVG,
    'MAX': MAX,
    'SUM': SUM,
}