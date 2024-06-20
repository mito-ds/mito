#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the fill_nan decorator.
"""
import pandas as pd
import numpy as np
import pytest

from mitosheet.public.v1.sheet_functions.types.decorators import fill_nans

FILL_NAN_TESTS = [
    (
        [pd.Series([1, 2, 3])], 
        1,
        pd.Series([1, 2, 3])
    ),
    (
        [pd.Series([1, 2, 3, np.nan])], 
        1,
        pd.Series([1.0, 2.0, 3.0, 1.0])
    ),
    (
        [pd.Series([1, 2, 3, np.nan])], 
        "Hi",
        pd.Series([1.0, 2.0, 3.0, "Hi"])
    ),
    (
        [pd.Series([np.nan, np.nan, np.nan])], 
        "Hi",
        pd.Series(["Hi", "Hi", "Hi"])
    ),
    (
        [pd.Series([np.nan, "Hi", np.nan])], 
        "Hi",
        pd.Series(["Hi", "Hi", "Hi"])
    ),
]

@pytest.mark.parametrize("args, new_value, final_arg", FILL_NAN_TESTS)
def test_fill_nan_one_arg(args, new_value, final_arg):

    @fill_nans(0, new_value)
    def fill_function(*func_args):
        assert func_args[0].equals(final_arg)

    fill_function(*args)



def test_fill_nan_multiple_arg():
    @fill_nans(0, "Hi")
    @fill_nans(1, "No")
    def fill_function(one, two):
        assert one.equals(pd.Series([1, 'Hi']))
        assert two.equals(pd.Series([2, 'No']))

    fill_function(pd.Series([1, np.nan]), pd.Series([2, np.nan]))