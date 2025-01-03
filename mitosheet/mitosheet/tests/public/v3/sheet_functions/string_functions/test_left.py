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

from mitosheet.public.v3.sheet_functions.string_functions import LEFT


LEFT_VALID_TESTS: Any = [
    # Just constant tests
    (['a', 1], 'a'),
    (['abc', 2], 'ab'),

    # Constants and series
    (['abc', pd.Series([0, 1, 2])], pd.Series(['', 'a', 'ab'])),
    (['abc', pd.Series([-1, -2, -3])], pd.Series(['ab', 'a', ''])),
    ([pd.Series(['a', 'ab', 'abc']), 2], pd.Series(['a', 'ab', 'ab'])),
    ([pd.Series(['a', 'ab', 'abc']), 10], pd.Series(['a', 'ab', 'abc'])),
    ([pd.Series(['a', 'ab', 'abc']), pd.Series([None, None, None])], pd.Series(['', '', ''])),
    ([pd.Series([1.0, None, None]), pd.Series([1, 1, 1])], pd.Series(['1', '', ''])),
    ([pd.Series([1.0, None, None]), pd.Series([None, None, None])], pd.Series(['', '', ''])),
    ([pd.Series([10000, 10.0, True, datetime(1997, 12, 22), timedelta(days=1)]), pd.Series([0, 1, 2, 3, 4, 5])], pd.Series(['', '1', 'Tr', '199', '1 da'])),
    ([pd.Series([10000, 10.0, True, datetime(1997, 12, 22), timedelta(days=1)]), pd.Series([1000, 1000, 1000, 1000, 1000, 1000])], pd.Series(['10000', '10.0', 'True', '1997-12-22 00:00:00', '1 day, 0:00:00'])),
    ([pd.Series([10000, 10.0, True, datetime(1997, 12, 22), timedelta(days=1)]), None], pd.Series(['1', '1', 'T', '1', '1'])),
]
# There aren't really any invalid types for strings

@pytest.mark.parametrize("_argv,expected", LEFT_VALID_TESTS)
def test_left(_argv, expected):
    result = LEFT(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected



LEFT_INVALID_TESTS: Any = [
    ([None, 1], ''),
    (['abc', None], 'a'),
    ([pd.DataFrame({'a': ['a', 'b', 'c'], 'b': [1, 2, 3]}), 1]),
    ([RollingRange(pd.DataFrame({'B': ['a', 'b', 'c'], 'C': [1, 2, 3]}), 2, 0), 1]),
]
@pytest.mark.parametrize("_argv", LEFT_INVALID_TESTS)
def test_invalid_args_error(_argv):
    with pytest.raises(MitoError) as e_info:
        LEFT(*_argv)

