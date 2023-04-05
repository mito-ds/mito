#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the HOUR function.
"""

from distutils.version import LooseVersion
import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import HOUR

if LooseVersion(pd.__version__) < LooseVersion('2.0'):
    dtype = 'int64'
else:
    dtype = 'int32'



HOUR_TESTS = [
    # Just constant tests
    (['2000-1-2'], 0),
    ([pd.to_datetime('2000-1-2 13:12:11')], 13),

    # Just series tests
    ([pd.Series(data=['2000-1-2 12:45:00', '2000-1-2 15:45:00'])], pd.Series([12, 15], dtype=dtype)),
    ([pd.Series(data=['2000-1-2 12:45:00', '2000-1-2 15:45:00', None])], pd.Series([12, 15, None])),
    ([pd.Series(data=['1/2/2000', 'abc', '1/4/2000 15:12:0'])], pd.Series([0,None,15])),
]

@pytest.mark.parametrize("_argv,expected", HOUR_TESTS)
def test_hour(_argv, expected):
    result = HOUR(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected
