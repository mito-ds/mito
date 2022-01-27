#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains tests for the ROUND function.
"""

import pytest
import pandas as pd

from mitosheet.sheet_functions.number_functions import ROUND
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

ROUND_VALID_TESTS = [
    ([0.111], 2, [.11]),
    ([0.111111], 2, [.11]),
    ([0.1], 2, [.1]),
    ([0.1], 0, [0]),
    (['(0.1)'], 1, [-.1]),
    (['$(0.1)'], 1, [-.1]),
    (['-$0.1'], 1, [-.1]),
    ([1000 * 1000 + .1], 0, [1000 * 1000]),
    ([1000 * 1000 + .1 + .1], 1, [1000 * 1000 + .1 + .1]),
    ([1.1], 0, [1]),
    ([1.100001], 0, [1]),
    ([True], 0, [True]),
    ([False], 0, [False]),
]
@pytest.mark.parametrize("data,decimals,rounded", ROUND_VALID_TESTS)
def test_ROUND_valid_input_direct(data, decimals, rounded):
    series = pd.Series(data=data)
    assert ROUND(series, decimals).tolist() == rounded

def test_ROUND_valid_input_direct_default():
    series = pd.Series(data=[1.111111])
    assert ROUND(series).tolist() == [1]

ROUND_SERIES_TESTS = [
    ([.1111], pd.Series([2]), [.11]),
    ([.11], pd.Series([0]), [0]),
]

@pytest.mark.parametrize("data,decimals,rounded", ROUND_SERIES_TESTS)
def test_ROUND_valid_input_direct_series(data, decimals, rounded):
    series = pd.Series(data=data)
    assert ROUND(series, decimals).tolist() == rounded


@pytest.mark.parametrize("data,decimals,rounded", ROUND_VALID_TESTS)
def test_ROUND_valid_input_sheet_formula_defaults_to_one(data, decimals, rounded):
    mito = create_mito_wrapper(data)
    mito.set_formula(f'=ROUND(A, {decimals})', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == rounded

ROUND_INVALID_TESTS = [
    (['True'], 0),
    (['Dork nork'], 10),
    ([''], 10),
]

@pytest.mark.parametrize("data,decimals", ROUND_INVALID_TESTS)
def test_ROUND_invalid_input_sheet_formula(data, decimals):
    mito = create_mito_wrapper(data)
    mito.set_formula(f'=100', 0, 'B', add_column=True)
    mito.set_formula(f'=ROUND(A, {decimals})', 0, 'B', add_column=True)
    assert pd.isna(mito.get_value(0, 'B', 1))


RIGHT_INVALID_FORMULAS = [
    ('=ROUNDA'),
    ('=ROUND(A))'),
    ('=roundA'),
]


@pytest.mark.parametrize("invalid_formula", RIGHT_INVALID_FORMULAS)
def test_RIGHT_invalid_formula_no_effect(invalid_formula):
    mito = create_mito_wrapper([' 1 '])
    mito.add_column(0, 'B')
    # We should not change the value of the created coumn
    mito.set_formula(invalid_formula, 0, 'B')
    assert mito.get_value(0, 'B', 1) == 0