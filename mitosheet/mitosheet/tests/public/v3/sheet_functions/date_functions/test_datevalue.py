#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the DATEVALUE function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import DATEVALUE
from mitosheet.tests.test_utils import create_mito_wrapper

DATEVALUE_TESTS = [
    # Just constant tests
    (['2005-12-13'], pd.Timestamp('2005-12-13 00:00:00')),

    # Constants and series
    ([pd.Series(data=['2005-12-13'], dtype='datetime64[ns]')], pd.Series(pd.Timestamp('2005-12-13 00:00:00'))),
    ([pd.Series(data=['13-12-2005'])], pd.Series(pd.Timestamp('2005-12-13 00:00:00'))),
    ([pd.Series(data=['12-13-2005'])], pd.Series(pd.Timestamp('2005-12-13 00:00:00'))),
    ([pd.Series(data=['2005-12-13'])], pd.Series(pd.Timestamp('2005-12-13 00:00:00'))),
    ([pd.Series(data=['13/12/2005'])], pd.Series(pd.Timestamp('2005-12-13 00:00:00'))),
    ([pd.Series(data=['12/13/2005'])], pd.Series(pd.Timestamp('2005-12-13 00:00:00'))),
    ([pd.Series(data=['2005/12/13'])], pd.Series(pd.Timestamp('2005-12-13 00:00:00'))),
]

@pytest.mark.parametrize("_argv,expected", DATEVALUE_TESTS)
def test_datevalue(_argv, expected):
    result = DATEVALUE(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected
