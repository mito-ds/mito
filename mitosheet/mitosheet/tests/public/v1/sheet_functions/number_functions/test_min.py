#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the MAX function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.public.v1.sheet_functions.number_functions import MIN
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

MIN_VALID_TESTS = [
    (
        pd.Series([1, 2, 3]),
        pd.Series([4, 5, 6]),
        pd.Series([1, 2, 3]),
    ),
    (
        pd.Series([-1, 2, -3]),
        pd.Series([4, -2, 6]),
        pd.Series([-1, -2, -3]),
    ),
    (
        pd.Series(['A', 2, 'C']),
        pd.Series([4, 'B', 6]),
        pd.Series([4.0, 2.0, 6.0]),
    ),
    (
        pd.Series(['A', -2, 'C']),
        pd.Series([-4, 'B', -6]),
        pd.Series([-4.0, -2.0, -6.0]),
    ),
    (
        pd.Series(['A', 'B', 'C']),
        pd.Series(['A', 'B', 'C']),
        pd.Series([float('inf'), float('inf'), float('inf')]),
    ),
    (
        pd.Series(['1', '2', '3']),
        pd.Series(['A', 'B', 'C']),
        pd.Series([1.0, 2.0, 3.0]),
    ),
    (
        pd.Series([100, 'C', 'C']),
        pd.Series([4, 200, True]),
        pd.Series([4, 200.0, 1.0]),
    ),
]
@pytest.mark.parametrize("series1, series2, output", MIN_VALID_TESTS)
def test_MIN_valid_input_direct(series1, series2, output):
    min = MIN(series1, series2)
    assert min.equals(output)

def test_MIN_mulitple_inputs():
    s1 = pd.Series([2, 1, 2])
    s2 = pd.Series([2, 2, 1])
    s3 = pd.Series([1, 2, 2])

    min = MIN(s1, s2, s3)
    assert min.equals(pd.Series([1, 1, 1]))

def test_MIN_in_sheet():
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula('=MIN(A, B)', 0, 'C', add_column=True)
    assert mito.get_value(0, 'C', 1) == 1
    