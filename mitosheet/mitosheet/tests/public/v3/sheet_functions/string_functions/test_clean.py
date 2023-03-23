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

from mitosheet.public.v3.sheet_functions.string_functions import LEN


LEN_VALID_TESTS: Any = [
    # Just constant tests
    (['A'], 1),
    (['ABC'], 3),
    ([1.0], 3),
    ([True], 4),
    ([None], 0),

    # Constants and series
    ([pd.Series(['ABC', '123', np.nan])], pd.Series([3, 3, 0])),
    ([pd.Series([1.0, None, None])], pd.Series([3, 0, 0])),
    ([pd.Series([np.nan, np.nan, np.nan])], pd.Series([0, 0, 0])),
    ([pd.Series([10000, 10.0, True, datetime(1997, 12, 22), timedelta(days=1), np.nan])], pd.Series([5, 4, 4, 19, 14, 0])),
]

# There aren't really any invalid types for strings

@pytest.mark.parametrize("_argv,expected", LEN_VALID_TESTS)
def test_len(_argv, expected):
    result = LEN(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected



LEN_INVALID_TESTS: Any = [
    # Dataframes
    ([pd.DataFrame({'a': ['a', 'b', 'c'], 'b': [1, 2, 3]}), 1]),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': ['a', 'b', 'c'], 'C': [1, 2, 3]}), 2, 0), 1]),
]
@pytest.mark.parametrize("_argv", LEN_INVALID_TESTS)
def test_invalid_args_error(_argv):
    with pytest.raises(MitoError) as e_info:
        LEN(*_argv)

