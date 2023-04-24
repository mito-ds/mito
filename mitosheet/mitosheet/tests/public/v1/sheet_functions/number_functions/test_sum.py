#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the SUM function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.public.v1.sheet_functions.number_functions import SUM
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# Raw function tests

SUM_NUMBER_TESTS = [
    ([2], 2),
    ([2, 3, 4], 2 + 3 + 4),
    ([2, 3, 4.5], 2 + 3 + 4.5),
    ([x for x in range(1, 21)], sum([x for x in range(1, 21)])),
    ([-1], -1),
    ([-1, '(1)', '$(1)'], -3),
    ([-1, -1, 10], 8),
    ([2, True], 3), # true is 1
    ([2, 'Hi'], 2),
    (["hi", "By", 2], 2)
]


@pytest.mark.parametrize("_argv,result", SUM_NUMBER_TESTS)
def test_mulitply_works_for_series_and_number(_argv, result):
    series = pd.Series(data=[0])
    if pd.isna(result):
        assert pd.isna(SUM(series, *_argv).tolist()[0])
    else:
        assert SUM(series, *_argv).tolist() == [result]


@pytest.mark.parametrize("_argv,result", SUM_NUMBER_TESTS)
def test_mulitply_works_for_all_numbers(_argv, result):
    assert SUM(*_argv).tolist() == [result]


# Tests of function in Mito

# We assume that A = 1, B = 2
SUM_TESTS_FORMULAS_VALID = [
    ('=SUM(A, B)', 3),
    ('=SUM(A, "Hi")', 1),
    ('=SUM(A, B, 3)', 6),
    ('=SUM(A, 3, B)', 6),
    ('=SUM(A, B, -1, -2)', 0),
    ('=SUM(-1, -2, A, B)', 0),
    ('=SUM(-1, -2 * 2, A, B * B)', 0)
]


@pytest.mark.parametrize("formula,result", SUM_TESTS_FORMULAS_VALID)
def test_SUM_formula_valid(formula, result):
    mito = create_mito_wrapper_with_data([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    assert mito.get_value(0, 'C', 1) == result