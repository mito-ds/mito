#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the CONCAT function.
"""

import pytest
import pandas as pd

from mitosheet.sheet_functions.string_functions import CONCAT
from mitosheet.tests.test_utils import create_mito_wrapper

# Raw function tests

CONCAT_TEST_CASES_STRINGS = [
    (['Hi', 'Apple', 'A', ' ', 'AAA'],  'HiAppleA AAA'),
    (['Hi', '', 'A'],  'HiA'),
    (['Hi', 'Apple', 123],  'HiApple123'),
    (['Hi', 'Apple', True],  'HiAppleTrue'),
    ([123],  '123'),
    ([123, 456, 789],  '123456789'),
    ([True, False], 'TrueFalse'),
    ([True, False, 'Hello'], 'TrueFalseHello'),
    ([True, False, 123], 'TrueFalse123'),
    ([pd.Timestamp('2017-01-01')], '2017-01-01 00:00:00'),
    ([pd.Timestamp('2017-01-01'), 'hi'], '2017-01-01 00:00:00hi'),
    ([pd.Timestamp('2017-01-01'), True, 123, "HI"], '2017-01-01 00:00:00True123HI'),
]

@pytest.mark.parametrize('to_concat,result', CONCAT_TEST_CASES_STRINGS)
def test_CONCAT_valid_input_direct_strings(to_concat, result):
    assert CONCAT(*to_concat).to_list() == [result]

CONCAT_TEST_CASES_SERIES = [
    ([pd.Series(data=['Hi']), 'Apple', 'A'],  ['HiAppleA']),
    ([pd.Series(data=['Hi']), pd.Series(data=['Apple']), 'A'],  ['HiAppleA']),
    (['A', pd.Series(data=['Hi']), pd.Series(data=['Apple'])],  ['AHiApple']),
    ([pd.Series(data=['Hi', 'Jim']), 'A', pd.Series(data=['Bye', 'Bye'])],  ['HiABye', 'JimABye'])
]

@pytest.mark.parametrize('to_concat,result', CONCAT_TEST_CASES_SERIES)
def test_CONCAT_valid_input_direct_series(to_concat, result):
    assert CONCAT(*to_concat).tolist() == result