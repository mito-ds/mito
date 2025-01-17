#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the MINUTE function.
"""

from packaging.version import Version
import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import MINUTE

if Version(pd.__version__) < Version('2.0'):
    dtype = 'int64'
else:
    dtype = 'int32'

MINUTE_TESTS = [
    # Just constant tests
    (['2000-1-2'], 0),
    ([pd.to_datetime('2000-1-2 13:12:11')], 12),

    # Just series tests
    ([pd.Series(data=['2000-1-2 12:45:00', '2000-1-2 15:12:00'])], pd.Series([45, 12], dtype=dtype)),
    ([pd.Series(data=['2000-1-2 12:45:00', '2000-1-2 15:45:00', None])], pd.Series([45, 45, None])),
    ([pd.Series(data=['1/2/2000', 'abc'])], pd.Series([0,None])),
]

@pytest.mark.parametrize("_argv,expected", MINUTE_TESTS)
def test_minute(_argv, expected):
    result = MINUTE(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected
