#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any
import pytest
import pandas as pd
import numpy as np
from mitosheet.errors import MitoError
from mitosheet.public.v3.rolling_range import RollingRange
from datetime import datetime, timedelta

from mitosheet.public.v3.sheet_functions.string_functions import TRIM


TRIM_VALID_TESTS: Any = [
    # Just constant tests
    ([' a '], 'a'),
    (['--abc '], '--abc'),
    ([' --abc'], '--abc'),

    # Constants and series
    ([pd.Series([' abc', '123 ', np.nan])], pd.Series(['abc', '123', ''])),
    ([pd.Series([1.0, None, None])], pd.Series(['1.0', '', ''])),
    ([pd.Series([np.nan, np.nan, np.nan])], pd.Series(['', '', ''])),
    ([pd.Series([10000, 10.0, True, datetime(1997, 12, 22), timedelta(days=1), np.nan, ' abc '])], pd.Series(['10000', '10.0', 'True', '1997-12-22 00:00:00', '1 day, 0:00:00', '', 'abc'])),
]

# There aren't really any invalid types for strings

@pytest.mark.parametrize("_argv,expected", TRIM_VALID_TESTS)
def test_trim(_argv, expected):
    result = TRIM(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected



TRIM_INVALID_TESTS: Any = [
    # Dataframes
    ([pd.DataFrame({'a': ['a', 'b', 'c'], 'b': [1, 2, 3]}), 1]),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': ['a', 'b', 'c'], 'C': [1, 2, 3]}), 2, 0), 1]),
]
@pytest.mark.parametrize("_argv", TRIM_INVALID_TESTS)
def test_invalid_args_error(_argv):
    with pytest.raises(MitoError) as e_info:
        TRIM(*_argv)

