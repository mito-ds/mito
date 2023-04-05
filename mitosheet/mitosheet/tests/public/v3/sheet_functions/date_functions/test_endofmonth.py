#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the ENDOFMONTH function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.date_functions import ENDOFMONTH

ENDOFMONTH_TESTS = [
    # Just constant tests
    (['2022-1-2 12:45:23'], pd.to_datetime('2022-1-31 00:00:00')),

    # Series
    ([pd.Series(data=['2022-1-2 12:45:23'])],  pd.Series(data=[pd.to_datetime('2022-1-31 00:00:00')])),
    ([pd.Series(data=['3-26-2023 12:45:23'])],  pd.Series(data=[pd.to_datetime('2023-3-31 00:00:00')])),
    ([pd.Series(data=['2/20/2023 12:45:23'])],  pd.Series(data=[pd.to_datetime('2023-2-28 00:00:00')])),
    ([pd.Series(data=['2/20/2023 12:45:23', None])],  pd.Series(data=[pd.to_datetime('2023-2-28 00:00:00'), None])),
    ([pd.Series(data=['4/20-2023 12:45:23', 'abc', '4/20-2023 12:45:23'])],  pd.Series(data=[pd.to_datetime('2023-4-30 00:00:00'), None, pd.to_datetime('2023-4-30 00:00:00')])),
]

@pytest.mark.parametrize("_argv,expected", ENDOFMONTH_TESTS)
def test_endofmonth(_argv, expected):
    result = ENDOFMONTH(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected
