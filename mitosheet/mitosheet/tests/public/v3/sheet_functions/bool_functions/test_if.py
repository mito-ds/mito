#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the IF function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.bool_functions import IF

# Raw function tests

IF_TESTS = [
    ([pd.Series([True]), pd.Series([1]), pd.Series([2])], pd.Series([1])),
    ([pd.Series([False]), pd.Series([1]), pd.Series([2])], pd.Series([2])),
    ([pd.Series([True, False]), pd.Series([1, 2]), pd.Series([3, 4])], pd.Series([1, 4])),
    ([pd.Series([True, False]), pd.Series(['A', 'B']), pd.Series(['C', 'D'])], pd.Series(['A', 'D'])),
    ([pd.Series([True, False]), pd.Series([True, True]), pd.Series([False, False])], pd.Series([True, False])),
    ([pd.Series([True, False]), pd.Series([pd.Timestamp('2017-01-01'), pd.Timestamp('2017-01-02')]), pd.Series([pd.Timestamp('2017-01-03'), pd.Timestamp('2017-01-04')])], pd.Series([pd.Timestamp('2017-01-01'), pd.Timestamp('2017-01-04')])),
    ([pd.Series([True, False]), pd.Series([1, None]), pd.Series([None, 4])], pd.Series([1.0, 4.0])),
    ([pd.Series([True, None]), pd.Series([1, None]), pd.Series([None, 4])], pd.Series([1.0, 4.0])),

    ([pd.Series(['T', 'F']), pd.Series([1, None]), pd.Series([None, 4])], pd.Series([1.0, 4.0])),
    ([pd.Series([1, 0]), pd.Series([1, None]), pd.Series([None, 4])], pd.Series([1.0, 4.0])),
]
@pytest.mark.parametrize("_argv, expected", IF_TESTS)
def test_if_direct(_argv, expected):
    result = IF(*_argv)
    print(result)
    print(expected)
    if isinstance(result, pd.Series):
        assert result.equals(expected)
    else: 
        assert result == expected

