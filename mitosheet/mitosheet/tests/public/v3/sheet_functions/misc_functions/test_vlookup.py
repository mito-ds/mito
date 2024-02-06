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
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.types import FC_NUMBER_EXACTLY

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
        pd.Series([None, 'c', 'b'], index=['i', 'j', 'k'])
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
    # Vlookup is case insensitive, with a non-standard index
    (
        [
            pd.Series(['a', 'b', 'a'], index=['i', 'j', 'k']),
            pd.DataFrame({'A': ['a', 'b'], 'B': ['Match1', 'Match2']}, index=[10, 11]),
            2
        ],
        pd.Series(['Match1', 'Match2', 'Match1'], index=['i', 'j', 'k'])
    ),
    # No matches
    (
        [
            pd.Series(['C']),
            pd.DataFrame({'Series to Look in': ['A']}),
            1
        ],
        pd.Series([None])
    ),
]

@pytest.mark.parametrize("_argv, expected", VLOOKUP_VALID_TESTS)
def test_vlookup_direct(_argv, expected):
    result = VLOOKUP(*_argv)
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


def test_filter_then_vlookup():
    df1 = pd.DataFrame({
        'A': [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
        'B': [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    })

    df2 = pd.DataFrame({
        'A': [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
        'C': [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
    })

    mito = create_mito_wrapper(df1, df2)
    mito.filter(0, "B", "And", FC_NUMBER_EXACTLY, 0)
    mito.set_formula('=VLOOKUP(A1,df2!A:C, 2)', 0, 'C', True)

    result = mito.get_column(0, 'C', True)
    expected = pd.Series([2,4,1,3,5], index=[1,3,5,7,9])

    assert result == list(expected)

def test_vlookup_with_datetime():
    df1 = pd.DataFrame({
        'A': [1, 2, 3],
    })

    df2 = pd.DataFrame({
        'A': [1, 2, 3],
        pd.to_datetime('2011-02-12'): pd.to_datetime(['2011-02-12', '2018-04-02', '2017-01-04']),
    })

    mito = create_mito_wrapper(df1, df2)
    mito.set_formula('=VLOOKUP(A0,df2!A:2011-02-12 00:00:00, 2)', 0, 'C', True)

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'A': [1, 2, 3],
            'C': pd.to_datetime(['2011-02-12', '2018-04-02', '2017-01-04']),
        })
    )

