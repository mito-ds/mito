#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the AVG function.
"""

import pytest
import pandas as pd
from statistics import mean
import numpy as np

from mitosheet.public_interfaces.v1.sheet_functions.number_functions import AVG
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

AVG_NUMBER_TESTS = [
    ([1], mean([0, 1])),
    (['$1'], mean([0, 1])),
    (['$(1)'], mean([0, -1])),
    (['$(1.1)'], mean([0, -1.1])),
    (['$(1.1)', 1.1], mean([0, -1.1, 1.1])),
    ([2, 3, 4], mean([0, 2, 3, 4])),
    ([2, 3, 4.5], mean([0, 2, 3, 4.5])),
    ([x for x in range(1, 21)], mean([x for x in range(0, 21)])),
    ([-1], mean([0, -1])),
    ([-1, -1, 10], mean([0, -1, -1, 10]))
]
@pytest.mark.parametrize("_argv,result", AVG_NUMBER_TESTS)
def test_avg_works_for_series_and_number(_argv, result):
    series = pd.Series(data=[0])
    assert AVG(series, *_argv).tolist() == [result]

@pytest.mark.parametrize("_argv,result", AVG_NUMBER_TESTS)
def test_avg_works_for_all_numbers(_argv, result):
    assert AVG(0, *_argv).tolist() == [result]


# Tests of function in Mito
# We assume that A = 1, B = 2
AVG_TESTS_FORMULAS_VALID = [
    ('=AVG(A, B)', 1.5),
    ('=AVG(A, B, 3)', 2),
    ('=AVG(A, 3, B)', 2),
    ('=AVG(A, B, -1, -2)', 0),
    ('=AVG(-1, -2, A, B)', 0),
    ('=AVG(-1, -2 * 2, A, B * B)', 0)
]
@pytest.mark.parametrize("formula,result", AVG_TESTS_FORMULAS_VALID)
def test_AVG_formula_valid(formula, result):
    mito = create_mito_wrapper([1])
    mito.set_formula('=2', 0, 'B', add_column=True)
    mito.set_formula(formula, 0, 'C', add_column=True)
    assert mito.get_value(0, 'C', 1) == result


AVG_TESTS_FORMULAS_NAN_NON_NUMBERS = [
    ('=\'Hi\'', '=AVG(A, B)', np.NaN),
    ('=True', '=AVG(A, B)', 1), # Treats True as 1 for some reason
]
@pytest.mark.parametrize("b_formula, non_number_formula, result", AVG_TESTS_FORMULAS_NAN_NON_NUMBERS)
def test_AVG_formula_non_numbers(b_formula, non_number_formula, result):
    mito = create_mito_wrapper([1])
    mito.set_formula(b_formula, 0, 'B', add_column=True)
    # Make sure column doesn't change with invalid formula
    mito.set_formula(non_number_formula, 0, 'C', add_column=True)
    if pd.isna(result):
        assert pd.isna(mito.get_value(0, 'C', 1))
    else:
        assert mito.get_value(0, 'C', 1) == result