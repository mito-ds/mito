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
from datetime import datetime

from mitosheet.public.v3.sheet_functions.string_functions import SUBSTITUTE


SUBSTITUTE_VALID_TESTS: Any = [
    # Just constant tests
    (['a', 'b', 'c', None], 'a'),
    (['a', 'a', 'c', None], 'c'),
    (['aaa', 'a', 'c', 2], 'cca'),
    ([1.0, '1', '2', None], '2.0'),
    (['this is a test this', 'this', True, None], 'True is a test True'),
    (['this is a test this', 'this', True, 1], 'True is a test this'),
    (['this is a test this', 'this', True, 1000], 'True is a test True'),
    ([None, 'a', 'c', 2], ''),
    (['abc', None, 'c', 2], 'abc'),
    (['abc', 'a', None, 2], 'abc'),


    # Constants and series
    (['a', pd.Series(['a', 'b', 'c']), pd.Series(['d', 'e', 'f']), None], pd.Series(['d', 'a', 'a'])),
    ([None, pd.Series(['a', 'b', 'c']), pd.Series(['d', 'e', 'f']), None], ''),
    (['a', pd.Series(['a', 'a', 'a']), pd.Series(['d', 'e', 'f']), None], pd.Series(['d', 'e', 'f'])),
    (['aaa', pd.Series(['a', 'a', 'a']), pd.Series(['d', 'e', 'f']), pd.Series([1, 2, 3])], pd.Series(['daa', 'eea', 'fff'])),
    (['aaa', pd.Series(['a', 'a', 'a']), pd.Series(['d', 'e', 'f']), pd.Series([1, 2, 0])], pd.Series(['daa', 'eea', 'aaa'])),
    ([pd.Series([np.nan, 'bba', np.nan]), pd.Series(['a', 'b', 'd']), pd.Series(['d', 'e', 'f']), pd.Series([1, 2, 0])], pd.Series(['', 'eea', ''])),
    (['aaa', pd.Series(['a', 'a', 'a']), pd.Series([np.nan, np.nan, np.nan]), None], pd.Series(['', '', ''])),
    #(['aaa', pd.Series(['a', 'a', 'a']), pd.Series(['d', 'e', 'f']), pd.Series([np.nan, np.nan, np.nan])], pd.Series(['ddd', 'eee', 'fff'])), TODO: Fix this. We can't cast a nan to an int
]

# There aren't really any invalid types for strings

@pytest.mark.parametrize("_argv,expected", SUBSTITUTE_VALID_TESTS)
def test_substitute(_argv, expected):
    result = SUBSTITUTE(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected




SUBSTITUTE_INVALID_TESTS: Any = [
    # Dataframes
    ([pd.DataFrame({'a': ['a', 'b', 'c'], 'b': [1, 2, 3]}), 'a', 'b', None]),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': ['a', 'b', 'c'], 'C': [1, 2, 3]}), 2, 0), 'a', 'b', None]),
]
@pytest.mark.parametrize("_argv", SUBSTITUTE_INVALID_TESTS)
def test_invalid_args_error(_argv):
    with pytest.raises(MitoError) as e_info:
        SUBSTITUTE(*_argv)
