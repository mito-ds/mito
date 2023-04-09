#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the WEEK function.
"""

from distutils.version import LooseVersion
import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import WEEK

if LooseVersion(pd.__version__) < LooseVersion('2.0'):
    int_dtype = 'int64'
    nan_dtype = 'float64'
else:
    int_dtype = 'UInt32'
    nan_dtype = 'UInt32'


WEEK_TESTS = [
    # Just constant tests
    (['2000-1-2'], 52), # See explanation, here: https://stackoverflow.com/questions/44372048/python-pandas-timestamp-week-returns-52-for-first-day-of-year
    ([pd.to_datetime('2000-1-5 13:12:11')], 1),

    # Just series tests
    ([pd.Series(data=['2000-1-2 12:45:00', '2000-1-5 13:12:11'])], pd.Series([52, 1], dtype=int_dtype)),
    ([pd.Series(data=['2000-1-2 12:45:00', '2000-1-5 13:12:11', None])], pd.Series([52, 1, None], dtype=nan_dtype)),
    ([pd.Series(data=['1/2/2000', 'abc', '2000-1-5 13:12:11'])], pd.Series([52, None, 1], dtype=nan_dtype)),
]

@pytest.mark.parametrize("_argv,expected", WEEK_TESTS)
def test_week(_argv, expected):
    result = WEEK(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected
