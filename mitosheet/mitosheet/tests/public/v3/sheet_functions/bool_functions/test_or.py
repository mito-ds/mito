#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any
import pytest
import pandas as pd
import numpy as np
from mitosheet.public.v3.rolling_range import RollingRange

from mitosheet.public.v3.sheet_functions.bool_functions import OR


OR_VALID_TESTS: Any = [
    # Just constant tests
    ([True, True], True),
    ([True, False], True),
    ([False, False], False),

    # Constants and series
    ([True, pd.Series([True,True,True])], pd.Series([True, True, True])),
    ([True, pd.Series([True,True,False])], pd.Series([True, True, True])),
    ([False, pd.Series([True,True,False])], pd.Series([True, True, False])),
    ([False, pd.Series([1,1,0])], pd.Series([True, True, False])),
    ([False, pd.Series(['True','True','False'])], pd.Series([True, True, False])),
    
    # Dataframes
    ([pd.DataFrame({'a': [False, False, False], 'b': [False, False, False]}), pd.Series([True,True,False])], pd.Series([True, True, False])),
    ([pd.DataFrame({'a': [False, False, False], 'b': [False, False, True]}), pd.Series([True,True,False])], pd.Series([True, True, True])),
    ([pd.DataFrame({'a': [False, False, False], 'b': ['False', 'False', 'False']}), pd.Series([True,True,False])], pd.Series([True, True, False])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [False, False, False], 'C': [False, False, True]}), 2, 0), False], pd.Series([False, True, True])), #A0 = OR(B0:C1, True)
    ([RollingRange(pd.DataFrame({'B': [True, True, True], 'C': [True, True, None]}), 3, 0)], pd.Series([True, True, True])), #A0 = OR(B0:C2)
    ([RollingRange(pd.DataFrame({'B': [True, True, False], 'C': [True, True, None]}), 3, 0)], pd.Series([True, True, False])), #A0 = OR(B0:C2)

]

OR_INVALID_CAST_TESTS: Any = [
    # Constants
    (['abc', 1], True),
    (['abc', 'def'], False), # Excel throws a value error here...

    # Series
    ([False, 'abc', pd.Series([True,True,False])], pd.Series([True, True, False])),
    (['abc', pd.Series([True,True,False])], pd.Series([True, True, False])),
    ([False, pd.Series(['abc',True, False])], pd.Series([False, True, False])),

    # Dataframes
    ([pd.DataFrame({'a': [False, False, False], 'b': [False, False, 'abc']}), pd.Series([True,True,False])], pd.Series([True,True,False])),
    ([pd.DataFrame({'a': [False, False, False], 'b': [False, False, 'abc']}), pd.Series([False, True,'abc'])], pd.Series([False,True,False])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': [False, False, 'abc'], 'C': [False, False, True]}), 2, 0), False], pd.Series([False, True, True])),
    ([RollingRange(pd.DataFrame({'B': [True, False, 'abc'], 'C': [False, True, False]}), 2, 0), 0, pd.Series([False, False, False])], pd.Series([True, True, False])),
    ([RollingRange(pd.DataFrame({'B': [False, True, 'abc'], 'C': [True, True, True]}), 2, 0), 0, pd.Series([False, False, None])], pd.Series([True, True, True])),
]

@pytest.mark.parametrize("_argv,expected", OR_VALID_TESTS + OR_INVALID_CAST_TESTS)
def test_or(_argv, expected):
    result = OR(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected