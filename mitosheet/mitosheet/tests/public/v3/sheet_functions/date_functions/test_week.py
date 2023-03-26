#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the WEEK function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import WEEK

WEEK_TESTS = [
    # Just constant tests
    (['2000-1-2'], 52), # See explanation, here: https://stackoverflow.com/questions/44372048/python-pandas-timestamp-week-returns-52-for-first-day-of-year
    ([pd.to_datetime('2000-1-5 13:12:11')], 1),

    # Just series tests
    ([pd.Series(data=['2000-1-2 12:45:00', '2000-1-5 13:12:11'])], pd.Series([52, 1])),
    ([pd.Series(data=['2000-1-2 12:45:00', '2000-1-5 13:12:11', None])], pd.Series([52, 1, None])),
    ([pd.Series(data=['1/2/2000', 'abc', '2000-1-5 13:12:11'])], pd.Series([52, None, 1])),
]

@pytest.mark.parametrize("_argv,expected", WEEK_TESTS)
def test_week(_argv, expected):
    result = WEEK(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        print(result)
        assert result == expected
