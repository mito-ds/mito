#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the MID function.
"""

import pytest
import pandas as pd

from mitosheet.public.v1.sheet_functions.string_functions import MID
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# Raw function tests

MID_VALID_TESTS = [
    (["ABCDEF"], 1, 1, ['A']),
    (["ABCDEF"], 1, 3, ['ABC']),
    (["ABCDEF"], 2, 2, ['BC']),
    (["ABCDEF"], 2, 1, ['B']),
    (["ABCDEF"], 2, 100, ['BCDEF']),
    (['     Abc Def'], 1, 3, ["   "]),
    (['ABC'], 1, 0, ['']),
    (['ABC'], 1, 100, ['ABC']),
    ([''], 1, 100, ['']),
    ([123], 2, 1, [2]),
    ([123], 1, 10, [123]),
    ([123.123], 3, 3, [3.1]),
    ([True, False], 1, 1, [True, False]),
    ([True, False, 'Hello'], 1, 1, ['T', 'F', "H"]),
]


@pytest.mark.parametrize("data,start,num,result", MID_VALID_TESTS)
def test_MID_works_for_series_and_number(data, start, num, result):
    series = pd.Series(data=data)
    assert MID(series, start, num).tolist() == result


MID_SERIES_TESTS = [
    (["ABCDEF"], pd.Series([2]), pd.Series([2]), ['BC']),
    (["ABCDEF"], pd.Series([2]), pd.Series([100]), ['BCDEF']),
    (["ABCDEF"], pd.Series([1]), pd.Series([100]), ['ABCDEF']),
]


@pytest.mark.parametrize("data,start,num,result", MID_SERIES_TESTS)
def test_MID_works_for_series_and_series(data, start, num, result):
    series = pd.Series(data=data)
    assert MID(series, start, num).tolist() == result

