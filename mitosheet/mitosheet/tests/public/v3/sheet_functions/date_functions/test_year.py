#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the YEAR function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import YEAR

YEAR_TESTS = [
    # Just constant tests
    (['2023-03-26'], 2023), 
    ([pd.to_datetime('2020-03-27 13:12:11')], 2020),

    # Just series tests
    ([pd.Series(data=['2023-03-26 12:45:00', '2023-03-08 13:12:11'])], pd.Series([2023, 2023])),
    ([pd.Series(data=['2021-03-26 12:45:00', '2023-03-08 13:12:11', None])], pd.Series([2021, 2023, None])),
    ([pd.Series(data=['2023-03-26 12:45:00', 'abc', '2023-03-08 13:12:11'])], pd.Series([2023, None, 2023])),
]

@pytest.mark.parametrize("_argv,expected", YEAR_TESTS)
def test_datevalue_works_on_inputs(_argv, expected):
    result = YEAR(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected
