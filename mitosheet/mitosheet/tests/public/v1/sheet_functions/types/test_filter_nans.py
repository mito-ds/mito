#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the filter_nan decorator.
"""
import pandas as pd
import numpy as np
import pytest

from mitosheet.public.v1.sheet_functions.types.decorators import filter_nans

FILTER_NAN_TESTS = [
    (
        [pd.Series([1, 2, 3])], 
        [pd.Series([1, 2, 3])]
    ),
    (
        [pd.Series([1.0, 2.0, 3.0]), pd.Series([1.0, 2.0, np.nan])], 
        [pd.Series([1.0, 2.0]), pd.Series([1.0, 2.0])]
    ),
    (
        [pd.Series([1.0, np.nan, 3.0]), pd.Series([1.0, 2.0, np.nan])], 
        [pd.Series([1.0]), pd.Series([1.0])]
    ),
    (
        [pd.Series([1.0, np.nan, 3.0]), pd.Series([1.0, 2.0, np.nan]), 'ABC', 2], 
        [pd.Series([1.0]), pd.Series([1.0]), 'ABC', 2]
    ),
    (
        [pd.Series([np.nan, 1.0, 3.0]), pd.Series([1.0, 2.0, np.nan])], 
        [pd.Series([1.0], index=[1]), pd.Series([2.0], index=[1])]
    ),
    (
        [pd.Series([np.nan, 3.0]), pd.Series([1.0, np.nan])], 
        [pd.Series([], dtype='float64'), pd.Series([], dtype='float64')]
    ),
]

@pytest.mark.parametrize("args, filtered_args", FILTER_NAN_TESTS)
def test_filter_nan(args, filtered_args):

    @filter_nans
    def filter_function(*func_args):
        for arg1, arg2 in zip(func_args, filtered_args):
            if isinstance(arg1, pd.Series):
                assert arg1.equals(arg2)
            else:
                assert arg1 == arg2
        return pd.Series([1] * len(func_args[0]))

    filter_function(*args)


