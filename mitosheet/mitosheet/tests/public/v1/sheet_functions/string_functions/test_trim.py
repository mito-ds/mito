#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the TRIM function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.string_functions import TRIM
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# Raw function tests

TRIM_VALID_TESTS = [
    (['ABC'], ['ABC']),
    (['  ABC   '], ['ABC']),
    (['  ABC'], ['ABC']),
    (['ABC     '], ['ABC']),
    (['A B C     '], ['A B C']),
    ([' Testing 123     '], ['Testing 123']),
    ([''], ['']),
    ([123], [123]),
    ([123.123], [123.123]),
    ([123.123000], [123.123]),
    ([True, False], [True, False]),
    ([True, False, "  Hello  "], ['True', 'False', "Hello"]),
    ([True, False, 123], ['True', 'False', '123']),
    ([pd.Timestamp('2017-01-01T12')], [pd.Timestamp('2017-01-01T12')]),
    ([pd.Timestamp('2017-01-01T12'), "hi  "], ['2017-01-01 12:00:00', "hi"]),
    ([pd.Timestamp('2017-01-01T12'), 1234], ['2017-01-01 12:00:00', '1234']),
    ([pd.Timestamp('2017-01-01T12'), True], ['2017-01-01 12:00:00', 'True']),
    ([pd.Timestamp('2017-01-01T12'), True, 123, "Hi "], ['2017-01-01 12:00:00', 'True', '123', 'Hi']),
]


@pytest.mark.parametrize("data,trimmed", TRIM_VALID_TESTS)
def test_TRIM_valid_input_direct(data, trimmed):
    series = pd.Series(data=data)
    assert TRIM(series).tolist() == trimmed


TRIM_STRING_TESTS = [
    ('ABC', 'ABC'),
    ('  ABC   ', 'ABC'),
    ('  ABC', 'ABC'),
    ('ABC     ', 'ABC'),
    ('A B C     ', 'A B C'),
    (' Testing 123     ', 'Testing 123'),
    ('', ''),
    (123, 123),
    (123.123, 123.123),
    (123.123000, 123.123),
    (True, True)
]


@pytest.mark.parametrize("data,trimmed", TRIM_STRING_TESTS)
def test_TRIM_valid_input_direct_string(data, trimmed):
    assert TRIM(data).tolist() == [trimmed]