#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the RIGHT function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.string_functions import RIGHT
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# Raw function tests

RIGHT_VALID_TESTS = [
    (['ABC'], 2, ['BC']),
    (['  ABC   '], 2, ['  ']),
    (['  ABC'], 2, ['BC']),
    (['Hi Hi'], 5, ['Hi Hi']),
    (['ABC'], 0, ['']),
    (['Testing 123'], 100, ['Testing 123']),
    ([''], 1, ['']),
    ([123], 1, [3]),
    ([123.456], 3, [456]),
    ([True, False], 4, [True, False]),
    ([True, False], 1, [False, False]),
    ([True, False, 'Hello'], 2, ['ue', 'se', 'lo']),
    ([True, False, 123], 2, ['ue', 'se', '23']),
    ([pd.Timestamp('2017-01-01T12'), pd.Timestamp('2017-01-01T12')], 50, [pd.Timestamp('2017-01-01T12'), pd.Timestamp('2017-01-01T12')]),
]
@pytest.mark.parametrize("data,length,trimmed", RIGHT_VALID_TESTS)
def test_RIGHT_valid_input_direct(data, length, trimmed):
    series = pd.Series(data=data)
    assert RIGHT(series, length).tolist() == trimmed


RIGHT_SERIES_TESTS = [
    (['  ABC'], pd.Series([2]), ['BC']),
    (['  ABC'], pd.Series([100]), ['  ABC']),
]


@pytest.mark.parametrize("data,length,trimmed", RIGHT_SERIES_TESTS)
def test_RIGHT_valid_input_direct_series(data, length, trimmed):
    series = pd.Series(data=data)
    assert RIGHT(series, length).tolist() == trimmed


RIGHT_VALID_TESTS_ONE_DEFAULT = [
    (['ABC'], ['C']),
    (['  ABC   '], [' ']),
    (['  ABC'], ['C']),
    (['Hi Hi'], ['i']),
    (['ABC'], ['C']),
    (['Testing 123'], ['3']),
    ([''], ['']),
    ([123], [3]),
    ([123.456], [6]),
    ([True, False], [False, False]),
    ([True, False, 'Hello'], ['e', 'e', 'o']),
    ([True, False, 123], ['e', 'e', '3']),
]


@pytest.mark.parametrize("data,trimmed", RIGHT_VALID_TESTS_ONE_DEFAULT)
def test_RIGHT_valid_input_direct_defaults_to_one(data, trimmed):
    series = pd.Series(data=data)
    assert RIGHT(series).tolist() == trimmed