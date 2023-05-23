#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pytest
import pandas as pd
import numpy as np
from mitosheet.public.v3.rolling_range import RollingRange

from mitosheet.public.v3.sheet_functions.number_functions import SUMPRODUCT


SUM_PRODUCT_VALID_TETS = [
    # Series
    ([pd.Series([1,2,3]), pd.Series([1,1,1])], 6),
    ([pd.Series([1,2,3]), pd.Series([1,2,3])], 14),
    ([pd.Series([1,2,3]), pd.Series([1,2,3.0])], 14.0),
    ([pd.Series([1,2,3]), pd.Series([1,2,3]), pd.Series([1,2,3])], 1 + 8 + 27),
    
    # Dataframes and series
    ([pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]}), pd.DataFrame({'a': [1, 1, 1], 'b': [2, 2, 2]})], 3 + 8 * 3),
]

SUM_INVALID_CAST_TESTS = [

    # Series
    ([pd.Series(['1','2','3']), pd.Series([1,1,1])], 6),

    # Dataframes
    ([pd.DataFrame({'a': ['1', '1', '1'], 'b': [2, 2, 2]}), pd.DataFrame({'a': ['2', '2', '2'], 'b': [1, 1, 1]})], 12.0),
]

@pytest.mark.parametrize("_argv,expected", SUM_PRODUCT_VALID_TETS + SUM_INVALID_CAST_TESTS)
def test_sumproduct(_argv, expected):
    result = SUMPRODUCT(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected