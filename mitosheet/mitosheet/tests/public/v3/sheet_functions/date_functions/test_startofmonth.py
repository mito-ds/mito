#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the STARTOFMONTH function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import STARTOFMONTH

STARTOFMONTH_TESTS = [
    # Just constant tests
    (['4-20-2023 12:45:23'], pd.to_datetime('2023-4-01 00:00:00')),

    # Series
    ([pd.Series(data=['4-20-2023 12:45:23'])],  pd.Series(data=[pd.to_datetime('2023-4-01 00:00:00')])),
    ([pd.Series(data=['4/20/2023 12:45:23'])],  pd.Series(data=[pd.to_datetime('2023-4-01 00:00:00')])),
    ([pd.Series(data=['4-20-2023 12:45:23', None])],  pd.Series(data=[pd.to_datetime('2023-4-01 00:00:00'), None])),
    ([pd.Series(data=['4/20-2023 12:45:23', 'abc', '4/20-2023 12:45:23'])],  pd.Series(data=[pd.to_datetime('2023-4-01 00:00:00'), None, pd.to_datetime('2023-4-01 00:00:00')])),
]

@pytest.mark.parametrize("_argv,expected", STARTOFMONTH_TESTS)
def test_datevalue_works_on_inputs(_argv, expected):
    result = STARTOFMONTH(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected
