#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the WEEK function.
"""

from packaging.version import Version
import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import WEEKDAY

if Version(pd.__version__) < Version('2.0'):
    dtype = 'int64'
else:
    dtype = 'int32'

WEEKDAY_TESTS = [
    # Just constant tests
    (['2023-03-26'], 7), 
    ([pd.to_datetime('2023-03-27 13:12:11')], 1),

    # Just series tests
    ([pd.Series(data=['2023-03-26 12:45:00', '2023-03-08 13:12:11'])], pd.Series([7, 3], dtype=dtype)),
    ([pd.Series(data=['2023-03-26 12:45:00', '2023-03-08 13:12:11', None])], pd.Series([7, 3, None])),
    ([pd.Series(data=['2023-03-26 12:45:00', 'abc', '2023-03-08 13:12:11'])], pd.Series([7, None, 3])),
]

@pytest.mark.parametrize("_argv,expected", WEEKDAY_TESTS)
def test_weekday(_argv, expected):
    result = WEEKDAY(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected
