#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the TYPE function.
"""

import pytest
import pandas as pd

from mitosheet.public.v3.sheet_functions.misc_functions import VLOOKUP

from mitosheet.errors import MitoError

VLOOKUP_VALID_TESTS = [
    # Tests for when the lookup value is a series
    (
        [
            pd.Series([3, 1, 2]),
            pd.DataFrame({'D': [1, 2, 3], 'E': ['d', 'e', 'f'], 'F': ['h', 'i', 'j']}),
            2
        ],
        pd.Series(['f', 'd', 'e'])
    ),
    (
        [
            pd.Series(['a', 'b', 'c']),
            pd.DataFrame({0: ['c', 'a', 'b'], 1: ['d', 'e', 'f'], 2: ['h', 'i', 'j']}),
            3
        ],
        pd.Series(['i', 'j', 'h'])
    ),
    # Tests for when the lookup value is a primitive
    (
        [
            'a',
            pd.DataFrame({0: ['c', 'a', 'b'], 1: ['d', 'e', 'f'], 2: ['h', 'i', 'j']}),
            2
        ],
        'e'
    ),
    # Tests for when the lookup value is a primitive, case insensitive
    (
        [
            'A',
            pd.DataFrame({0: ['c', 'a', 'b'], 1: ['d', 'e', 'f'], 2: ['h', 'i', 'j']}),
            2
        ],
        'e'
    ),
    # Tests for when the lookup value is a primitive, case insensitive
    (
        [
            'a',
            pd.DataFrame({0: ['C', 'A', 'B'], 1: ['d', 'e', 'f'], 2: ['h', 'i', 'j']}),
            2
        ],
        'e'
    ),
    # Tests for when the index argument is a series
    (
        [
            pd.Series(['a', 'b', 'c']),
            pd.DataFrame({0: ['c', 'a', 'b'], 1: ['d', 'e', 'f'], 2: ['h', 'i', 'j']}),
            pd.Series([2,3,1])
        ],
        pd.Series(['e', 'j', 'c'])
    ),
    # Date-time tests
    (
        [
            pd.Series(['a', 'b', 'c']),
            pd.DataFrame({0: ['c', 'a', 'b'], 1: [pd.Timestamp('2017-01-04'), pd.Timestamp('2011-02-12'), pd.Timestamp('2018-04-02')], 2: ['h', 'i', 'j']}),
            2
        ],
        pd.Series([pd.Timestamp('2011-02-12'), pd.Timestamp('2018-04-02'), pd.Timestamp('2017-01-04')])
    ),
    (
        [
            pd.Series([pd.Timestamp('2011-02-12'), pd.Timestamp('2018-04-02'), pd.Timestamp('2017-01-04')]),
            pd.DataFrame({'a': [pd.Timestamp('2017-01-04'), pd.Timestamp('2011-02-12'), pd.Timestamp('2018-04-02')], 2: ['h', 'i', 'j']}),
            2
        ],
        pd.Series(['i', 'j', 'h'])
    ),
    # Tests for when the lookup value is a primitive and the index argument is a series
    (
        [
            pd.Timestamp('2011-02-12'),
            pd.DataFrame({'a': [pd.Timestamp('2017-01-04'), pd.Timestamp('2011-02-12'), pd.Timestamp('2018-04-02')], 2: ['h', 'i', 'j'], 'b': ['a', 'b', 'c']}),
            pd.Series([2,3,1])
        ],
        pd.Series(['i', 'b', pd.Timestamp('2011-02-12')])
    ),
    # Tests for when there are duplicates
    (
        [
            pd.Series([3, 1, 2]),
            pd.DataFrame({'D': [3, 2, 3], 'E': ['d', 'e', 'f'], 'F': ['h', 'i', 'j']}),
            2
        ],
        pd.Series(['d', None, 'e'])
    ),
    (
        [
            pd.Series([3, 1, 3]),
            pd.DataFrame({'D': [1, 2, 3], 'E': ['d', 'e', 'f'], 'F': ['h', 'i', 'j']}),
            2
        ],
        pd.Series(['f', 'd', 'f'])
    ),
    (
        [
            pd.Series([1, 2, 3]),
            pd.DataFrame({'A': [2, 3], 'B': ['b', 'c']}),
            2
        ],
        pd.Series([None, 'b', 'c'])
    ),
    (
        [
            pd.Series([1, 2, 3]),
            pd.DataFrame({'A': [3, 2], 'B': ['b', 'c']}, index=[pd.Timestamp('2011-02-12'), pd.Timestamp('2018-04-02')]),
            2
        ],
        pd.Series([None, 'c', 'b'])
    ),
    (
        [
            pd.Series([1, 2, 3], index=['i', 'j', 'k']),
            pd.DataFrame({'A': [3, 2], 'B': ['b', 'c']}, index=[10, 11]),
            2
        ],
        pd.Series([None, 'c', 'b'])
    ),
    # Vlookup only returns first match
    (
        [
            pd.Series(['A', 'A']),
            pd.DataFrame({'Series to Look in': ['A', 'A'], 'Value to return': ['Match1', 'Match2']}),
            2
        ],
        pd.Series(['Match1', 'Match1'])
    ),
    # Vlookup is case insensitive
    (
        [
            pd.Series(['A', 'a']),
            pd.DataFrame({'Series to Look in': ['a', 'A'], 'Value to return': ['Match1', 'Match2']}),
            2
        ],
        pd.Series(['Match1', 'Match1'])
    ),
    # Vlookup is case insensitive, but the return value should be the original case
    (
        [
            pd.Series(['A']),
            pd.DataFrame({'Series to Look in': ['a']}),
            1
        ],
        pd.Series(['a'])
    ),
    # Vlookup is case insensitive, but the return value should be the original case
    (
        [
            pd.Series(['a']),
            pd.DataFrame({'Series to Look in': ['A']}),
            1
        ],
        pd.Series(['A'])
    ),
]

@pytest.mark.parametrize("_argv, expected", VLOOKUP_VALID_TESTS)
def test_vlookup_direct(_argv, expected):
    result = VLOOKUP(*_argv)
    print(result)
    print(expected)
    if isinstance(result, pd.Series):
        pd.testing.assert_series_equal(result, expected, check_names=False, check_series_type=False, check_dtype=False)
    else: 
        assert result == expected

# Invalid tests
VLOOKUP_INVALID_TESTS = [
    # Test for different types between lookup value and first column of where
    (
        [
            pd.Series([1, 2, 3]),
            pd.DataFrame({'D': ['a', 'b', 'c'], 'E': ['d', 'e', 'f'], 'F': ['h', 'i', 'j']}),
            2
        ],
        'VLOOKUP requires the lookup value and the first column of the where range to be the same type. The lookup value is of type int64 and the first column of the where range is of type string.'
    ),
    (
        [
            1,
            pd.DataFrame({'D': ['a', 'b', 'c'], 'E': ['d', 'e', 'f'], 'F': ['h', 'i', 'j']}),
            2
        ],
        "VLOOKUP requires the lookup value and the first column of the where range to be the same type. The lookup value is of type <class 'str'> and the first column of the where range is of type object."
    )
]
@pytest.mark.parametrize("_argv, expected", VLOOKUP_INVALID_TESTS)
def test_invalid_args_error(_argv, expected):
    with pytest.raises(MitoError) as e_info:
        VLOOKUP(*_argv)
        assert e_info.value.error_dict['error_type'] == 'invalid_args_error'
        assert e_info.value.error_dict['function_name'] == 'VLOOKUP'
        assert e_info.value.error_dict['error_message'] == expected
