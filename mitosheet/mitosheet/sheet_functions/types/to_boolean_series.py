#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
For going to a boolean series.
"""

from typing import Any

import numpy as np
import pandas as pd
from mitosheet.sheet_functions.types.utils import (is_bool_dtype,
                                                   is_datetime_dtype,
                                                   is_number_dtype,
                                                   is_string_dtype)


def to_boolean_series(
        unknown_object: Any,
        on_uncastable_arg_element: Any=('default', np.NaN), # Union[Literal['error'], Tuple[Literal['default'], any]]
    ) -> pd.Series:
    """
    Converts the given object to a boolean series. Note that on_uncastable_arg_element
    is irrelevant here, as anything can be turned into a boolean. 
    """

    # If it is not a series, we put it in a series, and get the type again
    if not isinstance(unknown_object, pd.Series):
        unknown_object = pd.Series([unknown_object])

    column_dtype = str(unknown_object.dtype)
    if is_bool_dtype(column_dtype):
        return unknown_object
    elif is_datetime_dtype(column_dtype):
        # For now, we treat all dates as true, and NaN values as False
        return ~unknown_object.isna()
    elif is_number_dtype(column_dtype):
        return unknown_object.fillna(False).astype('bool')
    elif is_string_dtype(column_dtype):
        string_to_bool_conversion_dict = {
            '1': True,
            '1.0': True,
            1: True,
            1.0: True,
            'TRUE': True,
            'True': True, 
            'true': True,
            'T': True,
            't': True,
            'Y': True,
            'y': True,
            #########################
            '0': False,
            '0.0': False,
            0: False,
            0.0: False,
            'FALSE': False,
            'False': False,
            'false': False,
            'F': False,
            'f': False,
            'N': False,
            'n': False
        }
        # Convert any NaN values to False
        return unknown_object.map(string_to_bool_conversion_dict).fillna(False)
    else:
        return None
