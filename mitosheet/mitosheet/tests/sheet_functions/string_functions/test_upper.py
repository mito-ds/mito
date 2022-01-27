#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains tests for the UPPER function.
"""

import pytest
import pandas as pd

from mitosheet.sheet_functions.string_functions import UPPER
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests
UPPER_VALID_TESTS = [
    (['ABC'], ['ABC']),
    (['  ABC   '], ['  ABC   ']),
    (['  abc'], ['  ABC']),
    (['abc     '], ['ABC     ']),
    (['a b c     '], ['A B C     ']),
    (['testing 123'], ['TESTING 123']),
    ([123], [123]),
    ([123.123], [123.123]),
    ([123.123000], [123.123]),
    ([True, False], [True, False]),
    ([True, False, 'Hello'], ['TRUE', 'FALSE', "HELLO"]),
    ([True, False, 123], ['TRUE', 'FALSE', '123']),
    ([pd.Timestamp('2017-01-01T12')], [pd.Timestamp('2017-01-01T12')]),
    ([pd.Timestamp('2017-01-01T12'), 'hi'], ['2017-01-01 12:00:00', 'HI']),
    ([pd.Timestamp('2017-01-01T12'), 1234], ['2017-01-01 12:00:00', '1234']),
    ([pd.Timestamp('2017-01-01T12'), True], ['2017-01-01 12:00:00', 'TRUE']),
    ([pd.Timestamp('2017-01-01T12'), True, 123, "HI"], ['2017-01-01 12:00:00', 'TRUE', '123', 'HI']),
]


@pytest.mark.parametrize("data,upper", UPPER_VALID_TESTS)
def test_UPPER_valid_input_direct(data, upper):
    series = pd.Series(data=data)
    assert UPPER(series).tolist() == upper


UPPER_STRING_TESTS = [
    ('abc', 'ABC'),
    ('  abc', '  ABC'),
    ('testing 123', 'TESTING 123'),
    (123, 123),
    (123.123, 123.123),
    (True, True)
]


@pytest.mark.parametrize("data,upper", UPPER_STRING_TESTS)
def test_UPPER_valid_input_direct_str(data, upper):
    assert UPPER(data).tolist() == [upper]


@pytest.mark.parametrize("data,upper", UPPER_VALID_TESTS)
def test_UPPER_valid_input_sheet_function(data, upper):
    mito = create_mito_wrapper(data)
    mito.set_formula('=UPPER(A)', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == upper