#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the POWER function.
"""

import numpy as np
import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.number_functions import POWER

# Raw function tests

POWER_VALID_TESTS = [
    ([pd.Series([1, 2, 3]), 2], pd.Series([1, 4, 9])),
    ([pd.Series([4, 9, 16]), 1/2], pd.Series([2.0, 3.0, 4.0])),
    ([pd.Series([4, 9, 16]), .5], pd.Series([2.0, 3.0, 4.0])),
    ([pd.Series([1, None, 3]), 2], pd.Series([1, np.nan, 9])),
    ([pd.Series([1, 2, 3]), pd.Series([2, 3, 4])], pd.Series([1, 8, 81])),
    ([pd.Series([4, 9, 16,]), pd.Series(['$.5', '(.5)', .5])], pd.Series([2, 0.3333333333333333, 4])),
    ([pd.Series([1, None, 3]), pd.Series([2, 2, 2])], pd.Series([1, np.nan, 9])),
    ([pd.Series([None, 2, 4]), pd.Series([2, None, 1/2])], pd.Series([np.nan, np.nan, 2])),
]
@pytest.mark.parametrize("_argv, expected", POWER_VALID_TESTS)
def test_power_valid_input_direct(_argv, expected):
    result = POWER(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected