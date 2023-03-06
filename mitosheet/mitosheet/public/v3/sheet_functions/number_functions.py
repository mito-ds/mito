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

from mitosheet.public.v3.rolling_range import RollingRange
from mitosheet.public.v3.types.decorators import cast_values_in_arg_to_type


@cast_values_in_arg_to_type('number')
def SUM(*argv: Union[int, float, None, pd.Series, RollingRange]):
    
    result: Union[pd.Series, float, int] = 0

    for arg in argv:

        if isinstance(arg, pd.DataFrame):
            result += arg.sum().sum()
        elif isinstance(arg, RollingRange):
            result += arg.apply(lambda df: df.sum().sum())
        elif arg is not None:
            result += arg

    return result 

# TODO: we should see if we can list these automatically!
NUMBER_FUNCTIONS = {
    'SUM': SUM,
}