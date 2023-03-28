#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pytest
import pandas as pd
import numpy as np
from mitosheet.public.v3.rolling_range import RollingRange

from mitosheet.public.v3.sheet_functions.number_functions import SUM


SUM_VALID_TESTS = [
    # Just constant tests
    ([2, 3], 5),
    ([2.0, 3.0], 5.0),
    ([2.0, '$3.0'], 5.0),
    ([2.0, True], 3.0),

    # Constants and series
    ([2, pd.Series([1,2,3])], pd.Series([3,4,5])),
    ([2.0, pd.Series([1,2,3])], pd.Series([3.0,4.0,5.0])),
    ([2.0, pd.Series([1,2,None])], pd.Series([3.0,4.0,2.0])),
    ([2.0, pd.Series(['1', '2', '3'])], pd.Series([3.0, 4.0, 5.0])),
    ([2.0, pd.Series(['1.0', '2.0', '3.0'])], pd.Series([3.0, 4.0, 5.0])),
    ([2.0, pd.Series(['$1.00', '$2.00', '$3.00'])], pd.Series([3.0, 4.0, 5.0])),
    ([2.0, pd.Series([None,2,3])], pd.Series([2.0,4.0,5.0])),
    
    # Dataframes
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), pd.Series([1,2,3])], pd.Series([10,11,12])),
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), 2], 11),
    ([pd.DataFrame({'a': ['$1', '$1', '$1'], 'b': [2, None, 2]}), pd.Series([1,2,3])], pd.Series([8.0,9.0,10.0])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3]}), 2, -1)], pd.Series([1, 3, 5])), #A1 = B0:B1
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, 0), 1], pd.Series([13, 17, 10])), #A0 = B0:C1 + 1
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, -1), 1], pd.Series([6, 13, 17])), #A1 = B0:C1 + 1
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, 1), 1], pd.Series([17, 10, 1])), #A0 = B1:C2 + 1
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 3, -1), 1], pd.Series([13, 22, 17])), #A1 = B0:C2 + 1
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 10, 0), 1], pd.Series([22, 17, 10])), #A1 = B0:C9 + 1
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 10, 10), 1], pd.Series([1, 1, 1])), #A1 = B11:C20 + 1
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 10, 10)], pd.Series([0, 0, 0])), #A1 = B11:C20
    ([RollingRange(pd.DataFrame({'A': [1, 2, 3], 'B': [1, 2, 3], 'C': [1, 2, 3]}), 3, 0), 1], pd.Series([19, 16, 10])), #A0 = A0:C2 + 1
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3, 4, 5, 6, 7, 8, 9]}), 5, -2)], pd.Series([6, 10, 15, 20, 25, 30, 35, 30, 24])), #A5 = B3:B7

    # Rolling ranges, series, dataframes, and constants
    # A0 = SUM(B0:C1, C, D, 4)
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, 0), pd.Series([1,2,3]), pd.DataFrame({'D': [2, 2, 2]}), 4], pd.Series([23, 28, 22])), 
    # A0 = SUM(B0:C1, C, D, 4) with None in rolling range
    ([RollingRange(pd.DataFrame({'B': [1, 2, None], 'C': [4, 5, 6]}), 2, 0), pd.Series([1,2,3]), pd.DataFrame({'D': [2, 2, 2]}), 4], pd.Series([23.0, 25.0, 19.0])), 
    # A0 = SUM(B0:C1, C, D, 4) with None in each component
    ([RollingRange(pd.DataFrame({'B': [1, 2, None], 'C': [4, None, 6]}), 2, 0), pd.Series([None,2,3]), pd.DataFrame({'D': [2, 2, None]}), 4], pd.Series([15.0, 18.0, 17.0])), 
]

SUM_INVALID_CAST_TESTS = [
    # Constants
    (['abc', 2], 2),
    (['abc', 'def'], 0),

    # Series
    ([2, 'abc', pd.Series([1,2,3])], pd.Series([3,4,5])),
    (['abc', pd.Series([1,2,3])], pd.Series([1,2,3])),
    ([2, pd.Series(['abc',2,3])], pd.Series([2.0,4.0,5.0])),

    # Dataframes
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 'abc']}), pd.Series([1,2,3])], pd.Series([8.0,9.0,10.0])),
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 'abc']}), pd.Series([1,2,'abc'])], pd.Series([8.0,9.0,7.0])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 1], pd.Series([13.0, 14.0, 7.0])),
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 1, pd.Series([1,2,3])], pd.Series([14.0, 16.0, 10.0])),
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 1, pd.Series([1,2,None])], pd.Series([14.0, 16.0, 7.0])),
]

@pytest.mark.parametrize("_argv,expected", SUM_VALID_TESTS + SUM_INVALID_CAST_TESTS)
def test_sum(_argv, expected):
    result = SUM(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected