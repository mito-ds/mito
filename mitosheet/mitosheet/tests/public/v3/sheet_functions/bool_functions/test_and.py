#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pytest
import pandas as pd
import numpy as np
from mitosheet.public.v3.rolling_range import RollingRange

from mitosheet.public.v3.sheet_functions.bool_functions import AND


AND_VALID_TESTS = [
    # Just constant tests
    ([True, True], True),
    ([True, False], False),

    # Constants and series
    ([True, pd.Series([True,True,True])], pd.Series([True, True, True])),
    ([True, pd.Series([True,True,False])], pd.Series([True, True, False])),
    ([True, pd.Series([1,1,0])], pd.Series([True, True, False])),
    ([True, pd.Series(['True','True','False'])], pd.Series([True, True, False])),
    
    # Dataframes
    ([pd.DataFrame({'a': [True, True, True], 'b': [True, True, True]}), pd.Series([True,True,False])], pd.Series([True, True, False])),
    ([pd.DataFrame({'a': [True, True, True], 'b': [True, True, False]}), pd.Series([True,True,False])], pd.Series([False, False, False])),
    ([pd.DataFrame({'a': [True, True, True], 'b': ['True', 'True', 'True']}), pd.Series([True,True,False])], pd.Series([True, True, False])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [True, True, True], 'C': [True, True, False]}), 2, 0), True], pd.Series([True, False, False])), #A0 = AND(B0:C1, True)
    ([RollingRange(pd.DataFrame({'B': [True, True, True], 'C': [True, True, None]}), 3, 0)], pd.Series([True, True, True])), #A0 = AND(B0:C2)
    ([RollingRange(pd.DataFrame({'B': [True, True, False], 'C': [True, True, None]}), 3, 0)], pd.Series([False, False, False])), #A0 = AND(B0:C2)

]

AND_INVALID_CAST_TESTS = [
    # Constants
    (['abc', 1], True),
    (['abc', 'def'], True), # Excel throws a value error here. Maybe we should return False? Idk

    # Series
    ([True, 'abc', pd.Series([True,True,False])], pd.Series([True, True, False])),
    (['abc', pd.Series([True,True,False])], pd.Series([True, True, False])),
    ([True, pd.Series(['abc',True, False])], pd.Series([True, True, False])),

    # Dataframes
    ([pd.DataFrame({'a': [True, True, True], 'b': [True, True, 'abc']}), pd.Series([True,True,False])], pd.Series([True,True,False])),
    ([pd.DataFrame({'a': [True, True, True], 'b': [True, True, 'abc']}), pd.Series([False, True,'abc'])], pd.Series([False,True,True])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [True, True, 'abc'], 'C': [True, True, True]}), 2, 0), True], pd.Series([True, True, True])),
    ([RollingRange(pd.DataFrame({'B': [True, True, 'abc'], 'C': [True, True, True]}), 2, 0), 1, pd.Series([False, True, True])], pd.Series([False, True, True])),
    ([RollingRange(pd.DataFrame({'B': [False, True, 'abc'], 'C': [True, True, True]}), 2, 0), 1, pd.Series([True, True, None])], pd.Series([False, True, True])),
]

@pytest.mark.parametrize("_argv,expected", AND_VALID_TESTS + AND_INVALID_CAST_TESTS)
def test_and(_argv, expected):
    result = AND(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected