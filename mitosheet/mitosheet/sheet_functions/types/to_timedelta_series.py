#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
For going to a timedelta series.
"""

from typing import Any, Tuple, Union
import pandas as pd
import numpy as np

from mitosheet.sheet_functions.types.utils import is_bool_dtype, is_datetime_dtype, is_number_dtype, is_string_dtype, is_timedelta_dtype


def to_timedelta_series(
        unknown_object: Any,
        on_uncastable_arg_element: Any=('default', np.NaN), #Union[Literal['error'], Tuple[Literal['default'], any]]
    ) -> pd.Series:
    """
    Converts the given object to a timedelta series. Note that on_uncastable_arg_element
    is irrelevant here.
    """

    # If it is not a series, we put it in a series, and get the type again
    if not isinstance(unknown_object, pd.Series):
        unknown_object = pd.Series([unknown_object])

    column_dtype = str(unknown_object.dtype)
    if is_bool_dtype(column_dtype):
        return None
    elif is_datetime_dtype(column_dtype):
        return None
    elif is_timedelta_dtype(column_dtype):
        return unknown_object
    elif is_number_dtype(column_dtype):
        return pd.to_timedelta(
            unknown_object, 
            unit='s',
            errors='coerce'
        )
    elif is_string_dtype(column_dtype):
        return pd.to_timedelta(
            unknown_object, 
            unit='s',
            errors='coerce'
        )
    else:
        return None
