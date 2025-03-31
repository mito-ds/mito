#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


"""
Contains tests for the OR function.
"""

import pytest
import pandas as pd
import numpy as np 

from mitosheet.public.v3.sheet_functions.bool_functions import BOOL

# Raw function tests

BOOL_VALID_TESTS = [
    ([1], True),
    ([0], False),
    ([pd.Series([1])], pd.Series([True])),
    ([pd.Series([0])], pd.Series([False])),
    ([pd.Series([0, 1, 0, 2])], pd.Series([False, True, False, True])),
    ([pd.Series([0, 1, 0, np.nan])], pd.Series([False, True, False, False])),
    ([pd.Series(['Hi', 'Hello', 'Nah', 'Doh'])], pd.Series([False, False, False, False])),
    ([pd.Series([np.nan, 'Hi', 'Hello', 'Nah', 'Doh'])], pd.Series([False, False, False, False, False])),
    ([pd.Series(['True', 'T', 0, 'Doh'])], pd.Series([True, True, False, False])),
]
@pytest.mark.parametrize("_argv, expected", BOOL_VALID_TESTS)
def test_bool_direct(_argv, expected):
    result = BOOL(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected

