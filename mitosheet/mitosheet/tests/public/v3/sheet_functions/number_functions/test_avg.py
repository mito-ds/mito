#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pytest
import pandas as pd
import numpy as np
from mitosheet.public.v3.rolling_range import RollingRange

from mitosheet.public.v3.sheet_functions.number_functions import AVG


AVG_VALID_TESTS = [
    # Just constant tests
    ([2, 3], 2.5),
    ([2.0, 3.0], 2.5),
    ([2.0, '$3.0'], 2.5),

    # Constants and series
    ([2, pd.Series([1,2,3])], pd.Series([1.5,2,2.5])),
    ([2, pd.Series([1,2,3])], pd.Series([1.5,2,2.5])),
    ([2.0, pd.Series([1,2,3])], pd.Series([1.5,2,2.5])),
    ([2.0, pd.Series([1,2,None])], pd.Series([1.5,2,2.0])),
    ([2.0, pd.Series(['1', '2', '3'])], pd.Series([1.5,2,2.5])),
    ([2.0, pd.Series(['1.0', '2.0', '3.0'])], pd.Series([1.5,2,2.5])),
    
    # Dataframes
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), pd.Series([1,2,3])], pd.Series([10/7, 11/7, 12/7])),
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), 2], 11/7),
    ([pd.DataFrame({'a': ['$1', '$1', '$1'], 'b': [2, None, 2]}), pd.Series([1,2,3])], pd.Series([8/6, 9/6, 10/6])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, 0), 1], pd.Series([13/5, 17/5, 10/3])), #A0 = AVG(B0:C1, 1)
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, -1), 1], pd.Series([6/3, 13/5, 17/5])), #A1 = AVG(B0:C1, 1)
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, 1), 1], pd.Series([17/5, 10/3, 1/1])), #A0 = AVG(B1:C2, 1)
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 3, -1), 1], pd.Series([13/5, 22/7, 17/5])), #A1 = AVG(B0:C2, 1)
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [1, 2, None]}), 3, 0)], pd.Series([9/5, 7/3, 3/1])), #A0 = AVG(B0:C2)

]

AVG_INVALID_CAST_TESTS = [
    # Constants
    (['abc', 2], 2),
    (['abc', 'def'], 0),

    # Series
    ([2, 'abc', pd.Series([1,2,3])], pd.Series([1.5,2,2.5])),
    (['abc', pd.Series([1,2,3])], pd.Series([1.0,2.0,3.0])),
    ([2, pd.Series(['abc',2,3])], pd.Series([2.0,2.0,2.5])),

    # Dataframes
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 'abc']}), pd.Series([1,2,3])], pd.Series([8.0/6,9.0/6,10.0/6])),
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 'abc']}), pd.Series([1,2,'abc'])], pd.Series([8.0/6,9.0/6,7.0/5])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 1], pd.Series([13.0/5, 14.0/4, 7.0/2])),
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 1, pd.Series([1,2,3])], pd.Series([14.0/6, 16.0/5, 10.0/3])),
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 1, pd.Series([1,2,None])], pd.Series([14.0/6, 16.0/5, 7.0/2])),
]

@pytest.mark.parametrize("_argv,expected", AVG_VALID_TESTS + AVG_INVALID_CAST_TESTS)
def test_avg(_argv, expected):
    result = AVG(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected