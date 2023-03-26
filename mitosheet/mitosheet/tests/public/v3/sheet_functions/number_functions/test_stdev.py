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
]
@pytest.mark.parametrize("_argv, expected", STDEV_VALID_TESTS)
def test_STDEV_valid_input_direct(_argv, expected):
    result = STDEV(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        if np.isnan(result) :
            assert np.isnan(expected)
        else:
            assert result == expected
