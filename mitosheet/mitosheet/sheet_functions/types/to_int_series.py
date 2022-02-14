#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
For going to a number series.
"""
from typing import Any
from mitosheet.sheet_functions.types.to_float_series import to_float_series

import numpy as np
import pandas as pd


def to_int_series(
        unknown_object: Any,
        on_uncastable_arg_element: Any=('default', np.NaN), # Union[Literal['error'], Tuple[Literal['default'], any]]
    ) -> pd.Series:

    float_series = to_float_series(unknown_object, on_uncastable_arg_element=on_uncastable_arg_element)
    # TODO: do we need to handle nan values?
    return float_series.astype(int)
