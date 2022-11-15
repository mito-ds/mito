#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
For going to a datetime series.
"""


from typing import Any

import numpy as np
import pandas as pd

from mitosheet.sheet_functions.types.utils import (get_datetime_format,
                                                   is_bool_dtype,
                                                   is_datetime_dtype,
                                                   is_number_dtype,
                                                   is_string_dtype)


def to_datetime_series(
        unknown_object: Any,
        on_uncastable_arg_element: Any=('default', np.NaN), # Union[Literal['error'], Tuple[Literal['default'], any]]
    ) -> pd.Series:
    """
    Converts the given object to a datetime series.
    """

    # If it is not a series, we put it in a series, and get the type again
    if not isinstance(unknown_object, pd.Series):
        unknown_object = pd.Series([unknown_object])

    column_dtype = str(unknown_object.dtype)
    if is_bool_dtype(column_dtype):
        return None
    elif is_datetime_dtype(column_dtype):
        return unknown_object
    if is_number_dtype(column_dtype):
        return None
    elif is_string_dtype(column_dtype):
        # TODO: improve this to work element wise!
        datetime_format = get_datetime_format(unknown_object)
        if datetime_format is not None:
            return pd.to_datetime(
                unknown_object,
                format=datetime_format,
                errors='coerce'
            )
        else:
            return pd.to_datetime(
                unknown_object,
                infer_datetime_format=True,
                errors='coerce'
            )
    else:
        return None
