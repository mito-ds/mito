#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pytest
import pandas as pd
import numpy as np
from mitosheet.public.v3.rolling_range import RollingRange

from mitosheet.public.v3.sheet_functions.number_functions import MULTIPLY


MULTIPLY_VALID_TESTS = [
    # Just constant tests
    ([2, 3], 6),
    ([2.0, 3.0], 6.0),
    ([2.0, '$3.0'], 6.0),
    ([2.0, True], 2.0),

    # Constants and series
    ([2, pd.Series([1,2,3])], pd.Series([2,4,6])),
    ([2.0, pd.Series([1,2,3])], pd.Series([2.0,4.0,6.0])),
    ([2.0, pd.Series([1,2,None])], pd.Series([2.0,4.0,2.0])),
    ([2.0, pd.Series(['1', '2', '3'])], pd.Series([2.0, 4.0, 6.0])),
    ([2.0, pd.Series(['1.0', '2.0', '3.0'])], pd.Series([2.0, 4.0, 6.0])),
    ([2.0, pd.Series(['$1.00', '$2.00', '$3.00'])], pd.Series([2.0, 4.0, 6.0])),
    ([2.0, pd.Series([None,2,3])], pd.Series([2.0,4.0,6.0])),
    
    # Dataframes
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), pd.Series([1,2,3])], pd.Series([8,16,24])),
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), 2], 16),
    ([pd.DataFrame({'a': ['$1', '$1', '$1'], 'b': [2, None, 2]}), pd.Series([1,2,3])], pd.Series([4.0, 8.0, 12.0])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3]}), 2, -1)], pd.Series([1, 2, 6])),
    ([RollingRange(pd.DataFrame({'A': [2, 2, 1], 'B': [2, 2, 1]}), 3, 0), 2], pd.Series([32, 8, 2])),
    ([RollingRange(pd.DataFrame({'B': [1, 2, None], 'C': [1, None, 2]}), 2, 0), pd.Series([None,1,2]), pd.DataFrame({'D': [2, 2, None]}), 2], pd.Series([16.0, 32.0, 32.0])), 
]

MULTIPLY_INVALID_CAST_TESTS = [
    # Constants
    (['abc', 2], 2),
    (['abc', 'def'], 1),

    # Series
    ([2, 'abc', pd.Series([1,2,3])], pd.Series([2,4,6])),
    (['abc', pd.Series([1,2,3])], pd.Series([1,2,3])),
    ([2, pd.Series(['abc',2,3])], pd.Series([2.0,4.0,6.0])),

    # Dataframes
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 'abc']}), pd.Series([1,2,3])], pd.Series([4.0,8.0,12.0])),
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 'abc']}), pd.Series([1,2,'abc'])], pd.Series([4.0,8.0,4.0])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 1], pd.Series([40.0, 60.0, 6.0])),
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 1, pd.Series([1,2,3])], pd.Series([40.0, 120.0, 18.0])),
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 1, pd.Series([1,2,None])], pd.Series([40.0, 120.0, 6.0])),
]

@pytest.mark.parametrize("_argv,expected", MULTIPLY_VALID_TESTS + MULTIPLY_INVALID_CAST_TESTS)
def test_multiply(_argv, expected):
    result = MULTIPLY(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected