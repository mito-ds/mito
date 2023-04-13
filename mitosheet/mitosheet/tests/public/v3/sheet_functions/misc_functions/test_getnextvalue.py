#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.misc_functions import GETNEXTVALUE

GETNEXTVALUE_TESTS = [
    (
        [pd.Series([1, 2, 3]), pd.Series([True, False, False])],
        pd.Series([1, -1, -1])
    ),
    (
        [pd.Series([1, 2, 3]), pd.Series([False, True, False])],
        pd.Series([2, 2, -1])
    ),
    (
        [pd.Series([1.5, 2.5, 3.5]), pd.Series([False, True, False])],
        pd.Series([2.5, 2.5, -1.0])
    ),
    (
        [pd.Series(['a', 'b', 'c']), pd.Series([False, True, False])],
        pd.Series(['b', 'b', ''])
    ),
    (
        [pd.Series(['a', 'b', 'c']), pd.Series([False, False, False])],
        pd.Series(['', '', ''])
    ),
    (
        [pd.Series([True, False, False]), pd.Series([True, False, True])],
        pd.Series([True, False, False])
    ),
    (
        [pd.Series(pd.to_datetime(['1/2/23', '1/2/23', '1/2/23'], format='%m/%d/%y')), pd.Series([False, True, True])],  
        pd.Series(pd.to_datetime(['1/2/23', '1/2/23', '1/2/23'], format='%m/%d/%y'))
    ),
]
@pytest.mark.parametrize("_argv, expected", GETNEXTVALUE_TESTS)
def test_getnextvalue_function(_argv, expected):
    result = GETNEXTVALUE(*_argv)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected