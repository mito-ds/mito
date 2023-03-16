#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any
import pytest
import pandas as pd
import numpy as np
from mitosheet.public.v3.rolling_range import RollingRange
from datetime import datetime

from mitosheet.public.v3.sheet_functions.string_functions import CONCAT


CONCAT_VALID_TESTS: Any = [
    # Just constant tests
    (['a', 'b'], 'ab'),
    (['a', 1, True], 'a1True'),

    # Constants and series
    (['a', pd.Series(['a', 'b', 'c'])], pd.Series(['aa', 'ab', 'ac'])),
    (['a', pd.Series(['a', True, 1.0])], pd.Series(['aa', 'aTrue', 'a1.0'])),
    
    # Dataframes
    ([pd.DataFrame({'a': ['a', 'b', 'c'], 'b': [1, 2, 3]}), pd.Series(['e','f','g'])], pd.Series(['abc123e', 'abc123f', 'abc123g'])),
    ([pd.DataFrame({'a': ['a', 'b', 'c'], 'b': [1, 2, 3]}), pd.Series([datetime(2000, 12, 2),datetime(2000, 12, 3),datetime(2000, 12, 4)])], pd.Series(['abc1232000-12-02 00:00:00', 'abc1232000-12-03 00:00:00', 'abc1232000-12-04 00:00:00'])),

    # Rolling ranges
    ([RollingRange(pd.DataFrame({'B': ['a', 'b', 'c'], 'C': [1, 2, 3]}), 2, 0), True], pd.Series(['ab12True', 'bc23True', 'c3True'])),
]

# There aren't really any invalid types for strings

@pytest.mark.parametrize("_argv,expected", CONCAT_VALID_TESTS)
def test_concat(_argv, expected):
    result = CONCAT(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected