#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
For going to a datetime series.
"""

from typing import Tuple, Union
import pandas as pd
import numpy as np
from mitosheet.sheet_functions.types.utils import BOOLEAN_SERIES, DATETIME_SERIES, NUMBER_SERIES, STRING_SERIES, get_mito_type, get_datetime_format

def to_datetime_series(
        unknown_object,
        on_uncastable_arg_element=('default', np.NaN), # Union[Literal['error'], Tuple[Literal['default'], any]]
    ):
    """
    Converts the given object to a datetime series.
    """
    from_type = get_mito_type(unknown_object)

    # If it is not a series, we put it in a series, and get the type again
    if not from_type.endswith('series'):
        unknown_object = pd.Series([unknown_object])
        from_type = get_mito_type(unknown_object)

    if from_type == BOOLEAN_SERIES:
        return None
    elif from_type == DATETIME_SERIES:
        return unknown_object
    if from_type == NUMBER_SERIES:
        return None
    elif from_type == STRING_SERIES:
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