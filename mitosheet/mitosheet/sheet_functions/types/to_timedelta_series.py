#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
For going to a timedelta series.
"""

from typing import Tuple, Union
import pandas as pd
import numpy as np

from mitosheet.sheet_functions.types.utils import BOOLEAN_SERIES, DATETIME_SERIES, NUMBER_SERIES, STRING_SERIES, TIMEDELTA_SERIES, get_mito_type


def to_timedelta_series(
        unknown_object,
        on_uncastable_arg_element=('default', np.NaN), #Union[Literal['error'], Tuple[Literal['default'], any]]
    ):
    """
    Converts the given object to a timedelta series. Note that on_uncastable_arg_element
    is irrelevant here.
    """
    from_type = get_mito_type(unknown_object)

    # If it is not a series, we put it in a series, and get the type again
    if not from_type.endswith('series'):
        unknown_object = pd.Series([unknown_object])
        from_type = get_mito_type(unknown_object)

    if from_type == BOOLEAN_SERIES:
        return None
    elif from_type == DATETIME_SERIES:
        return None
    elif from_type == TIMEDELTA_SERIES:
        return unknown_object
    elif from_type == NUMBER_SERIES:
        return pd.to_timedelta(
            unknown_object, 
            unit='s',
            errors='coerce'
        )
    elif from_type == STRING_SERIES:
        return pd.to_timedelta(
            unknown_object, 
            unit='s',
            errors='coerce'
        )
    else:
        return None
