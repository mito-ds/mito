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

import pandas as pd
from pandas.core.window import Rolling
from mitosheet.is_type_utils import is_float_dtype, is_int_dtype

from mitosheet.public.v3.types.decorators import cast_values_in_arg_to_type


@cast_values_in_arg_to_type('number')
def SUM(*argv: Union[pd.Series, int, float, Rolling]):
    
    result: Union[pd.Series, float, int] = 0

    for arg in argv:

        if isinstance(arg, pd.DataFrame):
            result += arg.sum().sum()
        elif isinstance(arg, Rolling):
            # We need to do some special work to handle a rolling range. Specifically, we have
            # to first append the end of the series or dataframe, so that we can calculate the sum 
            # correctly through the end of the window - fill values will not help us here
            obj = arg.obj
            if isinstance(obj, pd.Series):
                zero_rows = pd.Series(0, index=list(range(arg.window - 1)), dtype=obj.dtype)
                new_obj = pd.concat([obj, zero_rows])
                # Then, with these rows that will save our ending values, we calculate the sum, and shift it back 
                # by the length of the window - 1, and then take only those rows that we need
                series_sum = new_obj.rolling(window=arg.window).sum().shift(-(arg.window - 1), fill_value=0)[:len(obj)] 

                # Because .rolling adds NaN values at the top, we need to convert back to an int manually, if we
                # want an integer to be the final result
                series_dtype = str(obj.dtype)
                if is_int_dtype(series_dtype):
                    series_sum = series_sum.astype(int)

                result += series_sum
            elif isinstance(obj, pd.DataFrame):
                zero_rows = pd.DataFrame(0, index=list(range(arg.window - 1)), columns=obj.columns)
                new_obj = pd.concat([obj, zero_rows]) # TODO: do dtypes work here? Should we somehow do a numberic only filter?
                df_sum = new_obj.rolling(window=arg.window).sum().shift(-(arg.window - 1), fill_value=0)[:len(obj)] 

                # If there are ONLY int dtypes, then we do a cast to integer, to keep the types proper
                only_int = all(is_int_dtype(str(obj[col].dtype)) for col in obj)
                if only_int:
                    df_sum = df_sum.astype(int)


                # Note that we sum across columns, so we end up with a single series
                result += df_sum.sum(axis=1)
        else:
            result += arg

    return result 

# TODO: we should see if we can list these automatically!
NUMBER_FUNCTIONS = {
    'SUM': SUM,
}