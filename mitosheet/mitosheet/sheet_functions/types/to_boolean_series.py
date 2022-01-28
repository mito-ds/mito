#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
For going to a boolean series.
"""

from typing import Any

import numpy as np
import pandas as pd
from mitosheet.sheet_functions.types.utils import (BOOLEAN_SERIES,
                                                   DATETIME_SERIES,
                                                   NUMBER_SERIES,
                                                   STRING_SERIES,
                                                   get_mito_type)


def to_boolean_series(
        unknown_object: Any,
        on_uncastable_arg_element: Any=('default', np.NaN), # Union[Literal['error'], Tuple[Literal['default'], any]]
    ) -> pd.Series:
    """
    Converts the given object to a boolean series. Note that on_uncastable_arg_element
    is irrelevant here, as anything can be turned into a boolean. 
    """
    from_type = get_mito_type(unknown_object)

    # If it is not a series, we put it in a series, and get the type again
    if not from_type.endswith('series'):
        unknown_object = pd.Series([unknown_object])
        from_type = get_mito_type(unknown_object)

    if from_type == BOOLEAN_SERIES:
        return unknown_object
    elif from_type == DATETIME_SERIES:
        # For now, we treat all dates as true, and NaN values as False
        return ~unknown_object.isna()
    elif from_type == NUMBER_SERIES:
        return unknown_object.fillna(False).astype('bool')
    elif from_type == STRING_SERIES:
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
