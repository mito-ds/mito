#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import pytest
import pandas as pd
import numpy as np
from mitosheet.public.v3.rolling_range import RollingRange

from mitosheet.public.v3.sheet_functions.number_functions import MIN


MIN_VALID_TESTS = [
    # Just constant tests
    ([2, 3], 2),
    ([2.0, 3.0], 2.0),
    ([2.0, '$3.0'], 2.0),
    ([2.0, True], 1.0),
    ([-1.0, True], -1.0),

    # Constants and series
    ([2, pd.Series([1,2,3])], pd.Series([1,2,2])),
    ([2, pd.Series([1,2,3])], pd.Series([1,2,2])),
    ([-10, pd.Series([-10,-11,-12])], pd.Series([-10,-11,-12])),
    ([2.0, pd.Series([1,2,3])], pd.Series([1.0,2.0,2.0])),
    ([2.0, pd.Series([1,2,None])], pd.Series([1.0,2.0,2.0])),
    ([2.0, pd.Series(['1', '2', '3'])], pd.Series([1.0, 2.0, 2.0])),
    ([2.0, pd.Series(['1.0', '2.0', '3.0'])], pd.Series([1.0, 2.0, 2.0])),
    ([2.0, pd.Series([None, '2.0', '3.0'])], pd.Series([2.0, 2.0, 2.0])),
    ([pd.Series(pd.to_datetime(['1-1-2000', '1-2-2000'])), pd.Series(pd.to_datetime(['1-1-2001', '1-3-1997']))], pd.Series(pd.to_datetime(['1-1-2000', '1-3-1997']))),
    ([pd.to_datetime('1-1-2000'), pd.Series(pd.to_datetime(['1-1-2001', '1-3-1997']))], pd.Series(pd.to_datetime(['1-1-2000', '1-3-1997']))),

    
    # Dataframes
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), pd.Series([0,1,2])], pd.Series([0, 1, 1])),
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), 2], 1),
    ([pd.DataFrame({'a': ['$1', '$1', '$1'], 'b': [2, None, 2]}), pd.Series([1,2,3])], pd.Series([1.0, 1.0, 1.0])),
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [1, 1, 1]}), pd.Series([0,1,2])], pd.Series([0, 1, 1])),
    ([pd.DataFrame({'a': pd.to_datetime(['1-1-2001', '1-3-1997']), 'b': pd.to_datetime(['1-1-2001', '1-3-1997'])})], pd.to_datetime('1-3-1997')),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3]}), 2, 0), 4], pd.Series([1, 2, 3])), #A0 = MIN(B0:C1, 4)
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, -1), 10], pd.Series([1, 1, 2])), #A1 = MIN(B0:C1, 10)
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 2, 1), 10], pd.Series([2, 3, 0])), #A0 = MIN(B1:C2, 10)
    ([RollingRange(pd.DataFrame({'B': [1, 2, 3], 'C': [4, 5, 6]}), 3, -1), 4], pd.Series([1, 1, 2])), #A1 = MIN(B0:C2, 4)
    ([RollingRange(pd.DataFrame({'a': pd.to_datetime(['1-1-2001', '1-1-2001', '1-3-1997']), 'b': pd.to_datetime(['1-1-2001', '1-1-2001', '1-3-1997'])}), 2, 0), pd.to_datetime('1-1-2000')], pd.Series(pd.to_datetime(['1-1-2000', '1-3-1997', '1-3-1997']))), #A0 = MIN(B0:C1, 1)
]

MIN_INVALID_CAST_TESTS = [
    # Constants
    (['abc', 2], 2),
    (['abc', 'def'], 0),

    # Series
    ([2, 'abc', pd.Series([1,2,3])], pd.Series([1,2,2])),
    (['abc', pd.Series([1,2,3])], pd.Series([1,2,3])),
    ([2, pd.Series(['abc',2,3])], pd.Series([2,2,2])),

    # Dataframes
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 'abc']}), pd.Series([0,2,3])], pd.Series([0.0, 1.0, 1.0])),
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 'abc']}), pd.Series([0,2,'abc'])], pd.Series([0.0,1.0,1.0])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 13], pd.Series([1.0, 2.0, 6.0])),
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), 3, pd.Series([1,2,3])], pd.Series([1.0, 2.0, 3.0])),
    ([RollingRange(pd.DataFrame({'B': [1, 2, 'abc'], 'C': [4, 5, 6]}), 2, 0), pd.Series([1,2,'abc'])], pd.Series([1.0, 2.0, 6.0])),
]

@pytest.mark.parametrize("_argv,expected", MIN_VALID_TESTS + MIN_INVALID_CAST_TESTS)
def test_min(_argv, expected):
    result = MIN(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected