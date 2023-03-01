#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the MULTIPLY function.
"""

import pytest
import pandas as pd
import numpy as np
from math import factorial

from mitosheet.public.v1.sheet_functions.number_functions import MULTIPLY
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

MULTIPLY_NUMBER_TESTS = [
    ([2], 2),
    ([2, 3, 4], 2 * 3 * 4),
    ([2, 3, 4.5], 2 * 3 * 4.5),
    ([x for x in range(1, 21)], factorial(20)),
    ([-1], -1),
    ([-1, -1, 10], 10),
    ([-1, -1, '(1)'], -1),
    ([-1, -1, '$(1)'], -1),
    ([2, True], 2),
    ([2, 'Hi'], 2),
    (["hi", "By", 1], 1)
]


@pytest.mark.parametrize("_argv,result", MULTIPLY_NUMBER_TESTS)
def test_mulitply_works_for_series_and_number(_argv, result):
    series = pd.Series(data=[1])
    if pd.isna(result):
        assert pd.isna(MULTIPLY(series, *_argv).tolist()[0])
    else:
        assert MULTIPLY(series, *_argv).tolist() == [result]


def test_mulitply_different_length():
    series = pd.Series(data=[1, 2])
    assert MULTIPLY(1, series).tolist() == [1, 2]


@pytest.mark.parametrize("_argv,result", MULTIPLY_NUMBER_TESTS)
def test_mulitply_works_for_all_numbers(_argv, result):
    if pd.isna(result):
        assert pd.isna(MULTIPLY(*_argv).tolist()[0])
    else:
        assert MULTIPLY(*_argv).tolist() == [result]


# Tests of function in Mito

# We assume that A = 1, B = 2
MULTIPLY_TESTS_FORMULAS_VALID = [
    ('=MULTIPLY(A, B)', 2),
    ('=MULTIPLY(A, "HI")', 1),
    ('=MULTIPLY(A, B, 3)', 6),
    ('=MULTIPLY(A, 3, B)', 6),
    ('=MULTIPLY(A, B, -1, -2)', 4),
    ('=MULTIPLY(-1, -2, A, B)', 4),
    ('=MULTIPLY(-1, -2 * 2, A, B * B)', 16)
]


@pytest.mark.parametrize("formula,result", MULTIPLY_TESTS_FORMULAS_VALID)
def test_MULTIPLY_formula_valid(formula, result):
    mito = create_mito_wrapper([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    assert mito.get_value(0, 'C', 1) == result