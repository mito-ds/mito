#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
File that holds all the type conversion functions
"""
from typing import Any, Callable

import pandas as pd
from mitosheet.sheet_functions.types.to_boolean_series import to_boolean_series
from mitosheet.sheet_functions.types.to_datetime_series import \
    to_datetime_series
from mitosheet.sheet_functions.types.to_float_series import to_float_series
from mitosheet.sheet_functions.types.to_int_series import to_int_series
from mitosheet.sheet_functions.types.to_string_series import to_string_series
from mitosheet.sheet_functions.types.to_timedelta_series import \
    to_timedelta_series
from mitosheet.sheet_functions.types.utils import (is_bool_dtype,
                                                   is_datetime_dtype,
                                                   is_float_dtype,
                                                   is_int_dtype,
                                                   is_timedelta_dtype)

def to_series(ele: Any) -> pd.Series:
    return pd.Series([ele])

def get_function_to_convert_to_series(column_dtype: str) -> Callable:
    if is_bool_dtype(column_dtype):
        return to_boolean_series
    elif is_datetime_dtype(column_dtype):
        return to_datetime_series
    elif is_int_dtype(column_dtype):
        return to_int_series
    elif is_float_dtype(column_dtype):
        return to_float_series
    elif is_timedelta_dtype(column_dtype):
        return to_timedelta_series
    elif column_dtype == 'series':
        return to_series 
    
    # DEfault to string series
    return to_string_series
