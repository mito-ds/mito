#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the FILLNAN function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.misc_functions import GETPREVIOUSVALUE

GETPREVIOUSVALUE_VALID_TESTS = [
    (
        [pd.Series([1, 2, 3]), pd.Series([True, False, False])],
        pd.Series([1, 1, 1])
    ),
    (
        [pd.Series([1, 2, 3]), pd.Series([False, True, False])],
        pd.Series([-1, 2, 2])
    ),
    (
        [pd.Series([1.5, 2.5, 3.5]), pd.Series([False, True, False])],
        pd.Series([-1.0, 2.5, 2.5])
    ),
    (
        [pd.Series(['a', 'b', 'c']), pd.Series([False, True, False])],
        pd.Series(['', 'b', 'b'])
    ),
    (
        [pd.Series(['a', 'b', 'c']), pd.Series([False, False, False])],
        pd.Series(['', '', ''])
    ),
    (
        [pd.Series([True, False, False]), pd.Series([True, False, True])],
        pd.Series([True, True, False])
    ),
    (
        [pd.Series(pd.to_datetime(['1/2/23', '1/2/23', '1/2/23'], format='%m/%d/%y')), pd.Series([False, True, True])],  
        pd.Series(pd.to_datetime([pd.NaT, '1/2/23', '1/2/23'], format='%m/%d/%y'))
    ),
]
@pytest.mark.parametrize("_argv, expected", GETPREVIOUSVALUE_VALID_TESTS)
def test_bool_direct(_argv, expected):
    result = GETPREVIOUSVALUE(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected