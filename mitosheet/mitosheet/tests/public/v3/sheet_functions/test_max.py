#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the SUM function.
"""

import pytest
import pandas as pd
import numpy as np
from mitosheet.public.v3.rolling_range import RollingRange

from mitosheet.public.v3.sheet_functions.number_functions import MAX


MAX_VALID_TESTS = [
    # Just constant tests
    ([2, 3], 3),
    ([2.0, 3.0], 3.0),
    ([2.0, '$3.0'], 3.0),
    ([2.0, True], 2.0),
    ([-1.0, True], 1.0),

    # Constants and series
    ([2, pd.Series([1,2,3])], pd.Series([2,2,3])),
    ([2, pd.Series([1,2,3])], pd.Series([2,2,3])),
    ([-10, pd.Series([-10,-11,-12])], pd.Series([-10,-10,-10])),
    ([2.0, pd.Series([1,2,3])], pd.Series([2.0,2.0,3.0])),
    ([2.0, pd.Series([1,2,None])], pd.Series([2.0,2.0,None])),
    ([2.0, pd.Series(['1', '2', '3'])], pd.Series([2.0, 2.0, 3.0])),
    ([2.0, pd.Series(['1.0', '2.0', '3.0'])], pd.Series([2.0, 2.0, 3.0])),
    ([2.0, pd.Series([None, '2.0', '3.0'])], pd.Series([2.0, 2.0, 3.0])),
    
    # Dataframes
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), pd.Series([1,2,3])], pd.Series([9, 9, 9])),
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), 2], 9),
    ([pd.DataFrame({'a': ['$1', '$1', '$1'], 'b': [2, None, 2]}), pd.Series([1,2,3])], pd.Series([7.0, 7.0, 7.0])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, 0), 1], pd.Series([12, 16, 9])), #A0 = MAX(B0:C1, 1)
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, -1), 1], pd.Series([5, 12, 16])), #A1 = MAX(B0:C1, 1)
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, 1), 1], pd.Series([16, 9, 1])), #A0 = MAX(B1:C2, 1)
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 3, -1), 1], pd.Series([12, 21, 16])), #A1 = MAX(B0:C2, 1)
]

MAX_INVALID_CAST_TESTS = [
    # Constants
    (['abc', 2], 2),
    (['abc', 'def'], 0),

    # Series
    ([2, 'abc', pd.Series([1,2,3])], pd.Series([2,2,3])),
    (['abc', pd.Series([1,2,3])], pd.Series([1,2,3])),
    ([2, pd.Series(['abc',2,3])], pd.Series([np.NaN,2,3])),

    # Dataframes
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 'abc']}), pd.Series([1,2,3])], pd.Series([7.0, 7.0, 7.0])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 1], pd.Series([12.0, 13.0, 6.0])),
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 1, pd.Series([1,2,3])], pd.Series([12.0, 13.0, 6.0])),

    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 'abc']}), pd.Series([1,2,'abc'])], pd.Series([7.0,7.0,np.NaN])),
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), pd.Series([1,2,'abc'])], pd.Series([12.0, 13.0, 6.0])), # NOTE: minor inconsisntecy between this and above
]

@pytest.mark.parametrize("_argv,expected", MAX_VALID_TESTS + MAX_INVALID_CAST_TESTS)
def test_max(_argv, expected):
    result = MAX(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected