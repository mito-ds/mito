#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
For going to a string series.
"""

import pandas as pd
import numpy as np
from typing import Any

from mitosheet.sheet_functions.types.utils import is_bool_dtype, is_datetime_dtype, is_number_dtype, is_string_dtype, is_timedelta_dtype


def to_string_series(
        unknown_object: Any,
        on_uncastable_arg_element: Any=('default', np.NaN), #Union[Literal['error'], Tuple[Literal['default'], any]]
    ) -> pd.Series:
    """
    Converts the given object to a string series. Note that on_uncastable_arg_element
    is irrelevant here, as anything can be turned into a string!
    """

    # If it is not a series, we put it in a series, and set it to a string
    if not isinstance(unknown_object, pd.Series):
        return pd.Series([str(unknown_object)], dtype='str')

    column_dtype = str(unknown_object.dtype)
    if is_bool_dtype(column_dtype):
        return unknown_object.astype('str')
    elif is_datetime_dtype(column_dtype):
        return unknown_object.dt.strftime('%Y-%m-%d %X')
    elif is_timedelta_dtype(column_dtype):
        return unknown_object.astype('str')
    elif is_number_dtype(column_dtype):
        return unknown_object.astype('str')
    elif is_string_dtype(column_dtype):
        # We need to cast here, because object series are treated
        # as string series, and may contain other types
        return unknown_object.astype('str')
    else:
        return None