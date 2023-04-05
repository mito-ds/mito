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

from mitosheet.public.v3.sheet_functions.string_functions import MID


MID_VALID_TESTS: Any = [
    # Just constant tests
    (['a', 1, 1], 'a'),
    (['abc', 2, 1], 'b'),
    (['abc', 2, 2], 'bc'),

    # Constants and series
    (['abc', pd.Series([0, 1, 2]), pd.Series([0, 1, 2])], pd.Series(['', 'a', 'bc'])),
    (['abc', pd.Series([-1, -2, -3]), pd.Series([1, 1, 1])], pd.Series(['b', 'a', ''])),
    ([pd.Series(['a', 'ab', 'abc']), 2, 3], pd.Series(['', 'b', 'bc'])),
    ([pd.Series(['a', 'ab', 'abc']), 10, 10], pd.Series(['', '', ''])),
    ([pd.Series(['a', 'ab', 'abc']), -100, 10], pd.Series(['', '', ''])),
    ([pd.Series(['a', 'ab', 'abc']), pd.Series([None, None, None]), pd.Series([None, None, None])], pd.Series(['', '', ''])),
    ([pd.Series([1.0, None, None]), pd.Series([1, 1, 1]), pd.Series([1, 1, 1])], pd.Series(['1', '', ''])),
    ([pd.Series([1.0, None, None]), pd.Series([None, None, None]), pd.Series([None, None, None])], pd.Series(['', '', ''])),
    ([pd.Series([10000, 10.0, True, datetime(1997, 12, 22), timedelta(days=1)]), pd.Series([0, 1, 2, 3, 4, 5]), pd.Series([0, 1, 2, 3, 4, 5])], pd.Series(['', '1', 'ru', '97-', 'ay, '])),
]

# There aren't really any invalid types for strings

@pytest.mark.parametrize("_argv,expected", MID_VALID_TESTS)
def test_left(_argv, expected):
    result = MID(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected



MID_INVALID_TESTS: Any = [
    ([None, 2, 2], ''),
    (['abc', None, 2], ''),
    (['abc', 2, None], 'b'),
    ([pd.Series([10000, 10.0, True, datetime(1997, 12, 22), timedelta(days=1)]), pd.Series([1000, 1000, 1000, 1000, 1000, 1000]), None], pd.Series(['', '', '', '', ''])),
    ([pd.DataFrame({'a': ['a', 'b', 'c'], 'b': [1, 2, 3]}), 1]),
    ([RollingRange(pd.DataFrame({'B': ['a', 'b', 'c'], 'C': [1, 2, 3]}), 2, 0), 1]),
]
@pytest.mark.parametrize("_argv", MID_INVALID_TESTS)
def test_invalid_args_error(_argv):
    with pytest.raises(MitoError) as e_info:
        MID(*_argv)

