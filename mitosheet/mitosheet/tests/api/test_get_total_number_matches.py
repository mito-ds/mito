#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the add_formatting_to_excel_sheet function.
"""

import pandas as pd
import pytest

from mitosheet.tests.test_utils import create_mito_wrapper, create_mito_wrapper_with_data
from mitosheet.api.get_total_number_matches import get_total_number_matches
from mitosheet.tests.decorators import pandas_post_1_only

NUMBER_MATCHES_TESTS = [
    (
        ['abc', 'def', 'fgh', 'abc'],
        0, 
        'abc',
        2
    ),
    (
        ['abcdef', 'def', 'fgh', 'abc'],
        0, 
        'def',
        2
    ),
    (
        ['abc', 'def', 'fgh', 'abc'],
        0, 
        'f',
        2
    ),
    (
        ['abc', 'def', 'fgh', 'abc'],
        0, 
        'ef',
        1
    ),
    (
        ['abc', 'def', 'fgh', 'ABC'],
        0, 
        'abc',
        2
    ),

    # Tests for numbers
    (
        [1234, 123, 345, 456],
        0, 
        '123',
        2
    ),
    (
        [1234, 123.456, 345, 456],
        0, 
        '456',
        2
    ),
    (
        [123, 123.456, 345, 456],
        0, 
        '123',
        2
    ),
    (
        [123, 123.456, 345, 456],
        0, 
        '45',
        3
    ),
    (
        [123, 123.0, 345, 456],
        0, 
        '123',
        2
    ),

    # TODO: This test shows a case that doesn't align with the frontend.
    (
        [123, 123.0, 345, 456],
        0, 
        '123.0',
        2
    ),
    (
        [123000, 123, 345, 456],
        0, 
        '1230',
        1
    ),

    # Tests for booleans
    (
        [True, False, True, False],
        0,
        'True',
        2
    ),
    (
        [True, False, True, False],
        0,
        'False',
        2
    ),

    # Tests for dates
    (
        [pd.Timestamp('2021-01-01'), pd.Timestamp('2021-01-02'), pd.Timestamp('2021-01-03'), pd.Timestamp('2021-01-04')],
        0,
        '2021-01-01',
        1
    ),
    (
        [pd.Timestamp('2021-01-01'), pd.Timestamp('2021-01-02'), pd.Timestamp('2021-01-03'), pd.Timestamp('2021-01-04')],
        0,
        '2021-01',
        4
    ),
]

@pandas_post_1_only
@pytest.mark.parametrize("data,sheet_index,search_value,expected", NUMBER_MATCHES_TESTS)
# This tests exporting as excel without formatting
def test_get_number_matches(data, sheet_index, search_value, expected):
    # Create a mito wrapper with data
    test_wrapper = create_mito_wrapper_with_data(data)

    total_matches = get_total_number_matches({'sheet_index': sheet_index, 'search_value': search_value }, test_wrapper.mito_backend.steps_manager)
    
    # Check that the excel string is not empty
    assert total_matches == expected


NUMBER_MATCHES_TESTS_MULTIPLE_DF = [
    (
        [
            pd.DataFrame({'A': [1, 2, 3]}),
        ],
        0,
        '1',
        1
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': ['a', 'b', 'c'], 'C': [True, False, True], 'D': [pd.Timestamp('2021-01-01'), pd.Timestamp('2021-01-02'), pd.Timestamp('2021-01-03')]}),
            pd.DataFrame({'E': [3, 3, 3], 'F': ['c', 'c', 'd'], 'G': [True, False, False], 'H': [pd.Timestamp('2021-01-01'), pd.Timestamp('2021-01-02'), pd.Timestamp('2021-01-03')]})
        ],
        1,
        'c',
        2
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': ['a', 'b', 'c'], 'C': [True, False, True], 'D': [pd.Timestamp('2021-01-01'), pd.Timestamp('2021-01-02'), pd.Timestamp('2021-01-03')]}),
            pd.DataFrame({'E': [3, 3, 3], 'F': ['c', 'c', 'd'], 'G': [True, False, False], 'H': [pd.Timestamp('2021-01-01'), pd.Timestamp('2021-01-02'), pd.Timestamp('2021-01-03')]})
        ],
        0,
        'c',
        1
    )
]

@pandas_post_1_only
@pytest.mark.parametrize("dfs,sheet_index,search_value,expected", NUMBER_MATCHES_TESTS_MULTIPLE_DF)
def test_get_number_matches_multiple_dataframes(dfs,sheet_index,search_value,expected):
    test_wrapper = create_mito_wrapper(*dfs)

    total_matches = get_total_number_matches({'sheet_index': sheet_index, 'search_value': search_value }, test_wrapper.mito_backend.steps_manager)

    assert total_matches == expected