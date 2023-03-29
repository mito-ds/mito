#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the CORR function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.number_functions import CORR

# Raw function tests

CORR_VALID_TESTS = pd.Series([
    ([1, 2], 0),
    ([0, pd.Series([1,2,3])], 0),
    ([pd.Series([1,2,3]), 0], 0),
    ([pd.Series([1,2,3]), pd.Series([1,2,3])], 1),
    ([pd.Series(['1','2','3']), pd.Series(['1','2','3'])], 1),
    ([pd.Series([-1,-2,-3]), pd.Series([1,2,3])], -1),
    ([pd.Series([2,4,6]), pd.Series([1,2,3])], 1),
    ([pd.Series([-2,-4,6]), pd.Series([1,2,3])], 0.7559289460184544),
    ([pd.Series([-2,-4,6]), pd.Series([-1,-2,3])], 0.9999999999999998),
    ([pd.Series([-2,-4,6, None]), pd.Series([-1,-2,3, None])], 0.9999999999999998),
    ([pd.Series([1, None, 2, None, 3, None]), pd.Series([1, None, 2, None, 3, None])], 1),
    ([pd.Series([None, None, None, None, 1, 2]), pd.Series([None, None, None, None, 1, 2])], 0.9999999999999999),
    ([pd.Series([1, 2, None, None, 1, 2]), pd.Series([1, 2, None, None, 1, 2])], 1),
    ([pd.Series(['2', '5', '1', 2]), pd.Series([2, '5', 1, 2])], 1),
    ([pd.Series(['2', '5', '1', '2']), pd.Series(['2', '5', 1, 2])], 1),
])
@pytest.mark.parametrize("_argv, expected", CORR_VALID_TESTS)
def test_CORR_valid_input_direct(_argv, expected):
    result = CORR(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected