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

from mitosheet.public.v3.sheet_functions.string_functions import FIND


FIND_VALID_TESTS: Any = [
    # Just constant tests
    (['a', 'b'], 0),
    (['a', 'a'], 1),
    (['bca', 'a'], 3),
    (['bca', ''], 0),
    (['bcaaa', 'aaa'], 3),
    ([True, 'e'], 4),
    ([None, 'e'], 0),
    (['e', None], 0),


    # Constants and series
    (['a', pd.Series(['a', 'b', 'c'])], pd.Series([1, 0, 0])),
    ([pd.Series(['xxa', 'xbx', 'cxx', 'd']), pd.Series(['a', 'b', 'c', 'f'])], pd.Series([3, 2, 1, 0])),
    ([pd.Series([np.nan, 'xbx', 'cxx', 'd']), pd.Series(['a', 'b', 'c', 'f'])], pd.Series([0, 2, 1, 0])),
    ([pd.Series([np.nan, 'xbx', 'cxx', 'd']), pd.Series(['a', 'b', 'c', 'f'])], pd.Series([0, 2, 1, 0])),
    ([pd.Series(['True', 'x1.0x', 'cxx', 'd']), pd.Series([True, 1.0, 'c', 'f'])], pd.Series([1, 2, 1, 0])),
    ([pd.Series([10000, 10.0, True, datetime(1997, 12, 22), timedelta(days=1)]), pd.Series([1, 1, 'e', '22', 'days'])], pd.Series([1, 1, 4, 9, 0])),
]

# There aren't really any invalid types for strings

@pytest.mark.parametrize("_argv,expected", FIND_VALID_TESTS)
def test_find(_argv, expected):
    result = FIND(*_argv)
    print(result)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected




FIND_INVALID_TESTS: Any = [
    # Dataframes
    ([pd.DataFrame({'a': ['a', 'b', 'c'], 'b': [1, 2, 3]}), 'a', 'b', None]),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': ['a', 'b', 'c'], 'C': [1, 2, 3]}), 2, 0), 'a', 'b', None]),
]
@pytest.mark.parametrize("_argv", FIND_INVALID_TESTS)
def test_invalid_args_error(_argv):
    with pytest.raises(MitoError) as e_info:
        FIND(*_argv)
