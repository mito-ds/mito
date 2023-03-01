#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the LEFT function.
"""

import pytest
import pandas as pd

from mitosheet.public_interfaces.v1.sheet_functions.string_functions import LEFT
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

LEFT_VALID_TESTS = [
    (['ABC'], 2, ['AB']),
    (['  ABC   '], 2, ['  ']),
    (['ABC   '], 2, ['AB']),
    (['Hi Hi'], 5, ['Hi Hi']),
    (['ABC'], 0, ['']),
    (['Testing 123'], 100, ['Testing 123']),
    ([123], 1, [1]),
    ([123.456], 3, [123]),
    ([True, False], 4, [True, False]),
    ([True, False], 1, [True, False]),
    ([True, False, 'Hello'], 2, ['Tr', 'Fa', 'He']),
    ([True, False, 123], 2, ['Tr', 'Fa', '12']),
    ([pd.Timestamp('2017-01-01')], 50, [pd.Timestamp('2017-01-01')]),
]

@pytest.mark.parametrize("data, length, trimmed", LEFT_VALID_TESTS)
def test_LEFT_valid_input_direct(data, length, trimmed):
    series = pd.Series(data=data)
    assert LEFT(series, length).tolist() == trimmed
    if length == 1:
        assert LEFT(series).tolist() == trimmed



LEFT_SERIES_TESTS = [
    (['ABC'], pd.Series([1]), ['A']),
    (['ABC'], pd.Series([100]), ['ABC']),
]

@pytest.mark.parametrize("data, length, trimmed", LEFT_SERIES_TESTS)
def test_LEFT_valid_input_direct_series(data, length, trimmed):
    series = pd.Series(data=data)
    assert LEFT(series, length).tolist() == trimmed

LEFT_VALID_TESTS_ONE_DEFAULT = [
    (['ABC'], ['A']),
    (['  ABC   '], [' ']),
    (['ABC   '], ['A']),
    (['Hi Hi'], ['H']),
    (['ABC'], ['A']),
    (['Testing 123'], ['T']),
    ([''], ['']),
    ([123], [1]),
    ([123.456], [1]),
    ([True, False], [True, False]),
    ([True, False, 'Hello'], ['T', 'F', 'H']),
    ([True, False, 123], ['T', 'F', '1']),
]


@pytest.mark.parametrize("data, trimmed", LEFT_VALID_TESTS_ONE_DEFAULT)
def test_LEFT_valid_input_direct_defaults_to_one(data, trimmed):
    series = pd.Series(data=data)
    assert LEFT(series, 1).tolist() == trimmed


# Tests of function in Mito
@pytest.mark.parametrize("data,trimmed", LEFT_VALID_TESTS_ONE_DEFAULT)
def test_LEFT_valid_input_sheet_formula_defaults_to_one(data, trimmed):
    mito = create_mito_wrapper(data)
    mito.set_formula('=LEFT(A)', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == trimmed


@pytest.mark.parametrize("data, length,trimmed", LEFT_VALID_TESTS)
def test_LEFT_valid_input_sheet_formula_length(data, length, trimmed):
    mito = create_mito_wrapper(data)
    mito.set_formula(f'=LEFT(A, {length})', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == trimmed