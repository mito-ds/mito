#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the STD function.
"""

import numpy as np
import pytest
import pandas as pd
from mitosheet.public.v3.rolling_range import RollingRange

from mitosheet.public.v3.sheet_functions.number_functions import STDEV

# Raw function tests
STDEV_VALID_TESTS = [
    ([1], 0),
    ([pd.Series([1,2,3,4])], 1.2909944487358056),
    ([pd.Series(['1','2','3', '4'])], 1.2909944487358056),
    ([pd.Series([-1,-2,-3,-4])], 1.2909944487358056),
    ([pd.Series(['Aaron', 1, 2, 3, 4])], 1.2909944487358056),
    ([pd.Series(['Aaron','Aaron','Aaron'])], np.nan),
    ([pd.Series([1, 2, 3, None, 4])], 1.2909944487358056),
    ([pd.Series([1, 2, 3, None, 4])], 1.2909944487358056),
    ([pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})], 1.8708286933869707),
    ([pd.DataFrame({'A': [1, 2, 3], 'B': [4, np.nan, 6]})], 1.9235384061671346),
    ([pd.DataFrame({'A': ['1', '2', '3'], 'B': [4, np.nan, 6]})], 1.9235384061671346),
    ([RollingRange(pd.DataFrame({'A': ['1', '2', '4']}), 2, 0)], pd.Series([0.707107, 1.414214, np.nan])),
    ([RollingRange(pd.DataFrame({'A': ['1', '2', '4'], "B": [3, 4, 5]}), 2, 0)], pd.Series([1.290994449, 1.258305739, 0.707106781])),
]
@pytest.mark.parametrize("_argv, expected", STDEV_VALID_TESTS)
def test_STDEV_valid_input_direct(_argv, expected):
    result = STDEV(*_argv)
    if isinstance(result, pd.Series):
        # Check if the two series are close to equal using np.isclose, while also handling nan values
        assert np.allclose(result, expected, equal_nan=True)
    else: 
        if np.isnan(result) :
            assert np.isnan(expected)
        else:
            assert result == expected
