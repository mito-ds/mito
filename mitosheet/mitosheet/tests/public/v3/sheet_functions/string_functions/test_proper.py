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

from mitosheet.public.v3.sheet_functions.string_functions import PROPER


PROPER_VALID_TESTS: Any = [
    # Just constant tests
    (['a'], 'A'),
    (['first name last name'], 'First Name Last Name'),
    ([1.0], '1.0'),
    ([True], 'True'),

    # Constants and series
    ([pd.Series(['first name', '123', np.nan])], pd.Series(['First Name', '123', ''])),
    ([pd.Series([1.0, None, None])], pd.Series(['1.0', '', ''])),
    ([pd.Series([np.nan, np.nan, np.nan])], pd.Series(['', '', ''])),
    ([pd.Series([10000, 10.0, True, datetime(1997, 12, 22), timedelta(days=1), np.nan])], pd.Series(['10000', '10.0', 'True', '1997-12-22 00:00:00', '1 Day, 0:00:00', ''])),
]

# There aren't really any invalid types for strings

@pytest.mark.parametrize("_argv,expected", PROPER_VALID_TESTS)
def test_proper(_argv, expected):
    result = PROPER(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected



PROPER_INVALID_TESTS: Any = [
    ([None], ''),
    ([pd.DataFrame({'a': ['a', 'b', 'c'], 'b': [1, 2, 3]}), 1]),
    ([RollingRange(pd.DataFrame({'B': ['a', 'b', 'c'], 'C': [1, 2, 3]}), 2, 0), 1]),
]
@pytest.mark.parametrize("_argv", PROPER_INVALID_TESTS)
def test_invalid_args_error(_argv):
    with pytest.raises(MitoError) as e_info:
        PROPER(*_argv)

