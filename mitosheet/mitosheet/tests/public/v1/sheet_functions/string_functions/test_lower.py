#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the LOWER function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.string_functions import LOWER
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

LOWER_VALID_TESTS = [
    (['abc'], ['abc']),
    (['  abc   '], ['  abc   ']),
    (['  ABC'], ['  abc']),
    (['ABC     '], ['abc     ']),
    (['A B C     '], ['a b c     ']),
    (['TESTING 123'], ['testing 123']),
    ([123], [123]),
    ([123.123], [123.123]),
    ([123.123000], [123.123]),
    ([True, False], [True, False]),
    ([True, False, 'Hello'], ['true', 'false', "hello"]),
    ([True, False, 123], ['true', 'false', '123']),
    ([pd.Timestamp('2017-01-01')], [pd.Timestamp('2017-01-01')]),
    ([pd.Timestamp('2017-01-01'), 'hi'], ['2017-01-01 00:00:00', 'hi']), # TODO: not sure why these return 00:00:00
    ([pd.Timestamp('2017-01-01'), 1234], ['2017-01-01 00:00:00', '1234']),
    ([pd.Timestamp('2017-01-01'), True], ['2017-01-01 00:00:00', 'true']),
    ([pd.Timestamp('2017-01-01'), True, 123, "HI"], ['2017-01-01 00:00:00', 'true', '123', 'hi']),
]


@pytest.mark.parametrize("data,lower", LOWER_VALID_TESTS)
def test_LOWER_valid_input_direct(data, lower):
    series = pd.Series(data=data)
    assert LOWER(series).tolist() == lower


LOWER_STRING_TESTS = [
    ('abc', 'abc'),
    ('  ABC', '  abc'),
    ('TESTING 123', 'testing 123'),
    (123, 123),
    (123.123, 123.123),
    (True, True)
]


@pytest.mark.parametrize("data,lower", LOWER_STRING_TESTS)
def test_LOWER_valid_input_direct_str(data, lower):
    assert LOWER(data).tolist() == [lower]