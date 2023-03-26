#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the SECOND function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import SECOND

SECOND_TESTS = [
    # Just constant tests
    (['2000-1-2'], 0),
    (['2000-1-2 01:12:13'], 13),
    ([pd.to_datetime('2000-4-2 13:12:11')], 11),

    # Just series tests
    ([pd.Series(data=['2000-1-2 12:45:00', '2000-11-2 15:12:05'])], pd.Series([0, 5])),
    ([pd.Series(data=['2000-1-2 12:45:00', '2000-7-2 15:45:10', None])], pd.Series([0, 10, None])),
    ([pd.Series(data=['1/2/2000', 'abc', '4/1/2000 15:12:01'])], pd.Series([0, None, 1])),
]

@pytest.mark.parametrize("_argv,expected", SECOND_TESTS)
def test_datevalue_works_on_inputs(_argv, expected):
    result = SECOND(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected
