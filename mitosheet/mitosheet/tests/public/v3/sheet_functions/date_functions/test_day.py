#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the DAY function.
"""

from packaging.version import Version
import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import DAY

# Handle dtypes if we're on pandas < 2.0
if Version(pd.__version__) < Version('2.0'):
    dtype = 'int64'
else:
    dtype = 'int32'

DAY_TESTS = [
    # Just constant tests
    (['2000-1-2'], 2),

    # Constants and series
    ([pd.Series(data=['2000-1-2'])], pd.Series(2, dtype=dtype)),
    ([pd.Series(data=['2000-1-2'])], pd.Series(2, dtype=dtype)),
    ([pd.Series(data=['1/2/2000'])], pd.Series(2, dtype=dtype)),
    ([pd.Series(data=['1/2/2000', '1/3/2000', '1/4/2000'])], pd.Series([2,3,4], dtype=dtype)),
    ([pd.Series(data=['1/2/2000', None, '1/4/2000'])], pd.Series([2,None,4])),
]

@pytest.mark.parametrize("_argv,expected", DAY_TESTS)
def test_day(_argv, expected):
    result = DAY(*_argv)
    if isinstance(result, pd.Series):
        # Check two series are equal, ignoring dtype
        assert result.equals(expected)
    else: 
        assert result == expected
