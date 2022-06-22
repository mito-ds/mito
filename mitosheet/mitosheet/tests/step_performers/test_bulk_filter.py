#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Bulk Filter
"""

import pandas as pd
import pytest
from mitosheet.step_performers.bulk_filter import BULK_FILTER_TOGGLE_ALL_MATCHING, BULK_FILTER_TOGGLE_SPECIFIC_VALUE
from mitosheet.step_performers.filter import FC_NUMBER_GREATER
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

df = pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})

BULK_FILTER_TESTS = [
    (
        [
            df.copy(deep=True)
        ],
        0, 
        "A", 
        {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 1, 'remove_from_dataframe': True},
        [
            df.iloc[1:]
        ]
    ),
    (
        [
            df.copy(deep=True)
        ],
        0, 
        "B", 
        {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 1.0, 'remove_from_dataframe': True},
        [
            df.iloc[1:]
        ]
    ),
    (
        [
            df.copy(deep=True)
        ],
        0, 
        "C", 
        {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': True, 'remove_from_dataframe': True},
        [
            df.iloc[1:2]
        ]
    ),
    (
        [
            df.copy(deep=True)
        ],
        0, 
        "D", 
        {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 'string', 'remove_from_dataframe': True},
        [
            df.iloc[1:]
        ]
    ),
    (
        [
            df.copy(deep=True)
        ],
        0, 
        "E", 
        {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': pd.to_datetime('12-22-1997'), 'remove_from_dataframe': True},
        [
            df.iloc[1:]
        ]
    ),
    (
        [
            df.copy(deep=True)
        ],
        0, 
        "F", 
        {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': pd.to_timedelta('1 days'), 'remove_from_dataframe': True},
        [
            df.iloc[1:]
        ]
    ),
    (
        [
            pd.DataFrame({'A': [11, 111, 123]})
        ],
        0, 
        "A", 
        {'type': BULK_FILTER_TOGGLE_ALL_MATCHING, 'search_string': '11', 'remove_from_dataframe': True},
        [
            pd.DataFrame({'A': [123]}, index=[2])
        ]
    ),
    (
        [
            df.copy(deep=True)
        ],
        0, 
        "B", 
        {'type': BULK_FILTER_TOGGLE_ALL_MATCHING, 'search_string': '1', 'remove_from_dataframe': True},
        [
            df.iloc[1:]
        ]
    ),
    (
        [
            df.copy(deep=True)
        ],
        0, 
        "C", 
        {'type': BULK_FILTER_TOGGLE_ALL_MATCHING, 'search_string': 'True', 'remove_from_dataframe': True},
        [
            df.iloc[1:2]
        ]
    ),
    (
        [
            df.copy(deep=True)
        ],
        0, 
        "D", 
        {'type': BULK_FILTER_TOGGLE_ALL_MATCHING, 'search_string': 's', 'remove_from_dataframe': True},
        [
            df.iloc[0:0]
        ]
    ),
    (
        [
            df.copy(deep=True)
        ],
        0, 
        "E", 
        {'type': BULK_FILTER_TOGGLE_ALL_MATCHING, 'search_string': '1997', 'remove_from_dataframe': True},
        [
            df.iloc[0:0]
        ]
    ),
    (
        [
            df.copy(deep=True)
        ],
        0, 
        "F", 
        {'type': BULK_FILTER_TOGGLE_ALL_MATCHING, 'search_string': 'days', 'remove_from_dataframe': True},
        [
            df.iloc[0:0]
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, sheet_index, column_header, toggle_type, output_dfs", BULK_FILTER_TESTS)
def test_bulk_filter(input_dfs, sheet_index, column_header, toggle_type, output_dfs):
    mito = create_mito_wrapper_dfs(*input_dfs)

    mito.bulk_filter(sheet_index, column_header, toggle_type)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)
    
    toggle_type['remove_from_dataframe'] = False
    mito.bulk_filter(sheet_index, column_header, toggle_type)
    for actual, expected in zip(mito.dfs, input_dfs):
        assert actual.equals(expected)
    

def test_two_bulk_filters_filters_both():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3, 4, 5]}))
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 1, 'remove_from_dataframe': True})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 4, 'remove_from_dataframe': True})

    assert mito.dfs[0].equals(pd.DataFrame({'A': [2, 3, 5]}, index=[1, 2, 4]))

def test_two_bulk_filters_filters_both_with_step_in_middle():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3, 4, 5]}))
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 1, 'remove_from_dataframe': True})
    mito.add_column(0, 'B', -1)
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 4, 'remove_from_dataframe': True})

    assert mito.dfs[0].equals(pd.DataFrame({'A': [2, 3, 5], 'B': [0, 0, 0]}, index=[1, 2, 4]))

def test_bulk_filter_with_normal_filter():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3, 4, 5]}))
    mito.filter(0, 'A', 'And', FC_NUMBER_GREATER, 3)
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 1, 'remove_from_dataframe': False})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 4, 'remove_from_dataframe': True})

    assert mito.dfs[0].equals(pd.DataFrame({'A': [5]}, index=[4]))

    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 4, 'remove_from_dataframe': False})
    assert mito.dfs[0].equals(pd.DataFrame({'A': [4, 5]}, index=[3, 4]))

    mito.filter(0, 'A', 'And', FC_NUMBER_GREATER, 5)
    assert mito.dfs[0]['A'].empty

def test_replay_bulk_filters():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3, 4, 5]}))
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 1, 'remove_from_dataframe': True})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 4, 'remove_from_dataframe': True})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 4, 'remove_from_dataframe': False})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 1, 'remove_from_dataframe': False})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 1, 'remove_from_dataframe': True})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 4, 'remove_from_dataframe': True})
    mito.save_analysis('test-123123')
    
    new_mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3, 4, 5]}))
    new_mito.replay_analysis('test-123123')

    assert new_mito.dfs[0].equals(pd.DataFrame({'A': [2, 3, 5]}, index=[1, 2, 4]))
    assert new_mito.curr_step.column_filters[0]['A']['filtered_out_values'] == {1, 4}

def test_defaults_to_exclusive_if_smaller():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3, 4, 5]}))
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 1, 'remove_from_dataframe': True})
    assert '[1]' in mito.transpiled_code[0]

def test_defaults_to_inclusive_if_smaller():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3, 4, 5]}))
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 1, 'remove_from_dataframe': True})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 2, 'remove_from_dataframe': True})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 3, 'remove_from_dataframe': True})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 4, 'remove_from_dataframe': True})
    assert '[5]' in mito.transpiled_code[0]

def test_inclusive_and_other_filters():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3, 4, 5]}))
    mito.filter(0, 'A', 'And', FC_NUMBER_GREATER, 1)
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 2, 'remove_from_dataframe': True})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 3, 'remove_from_dataframe': True})
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 4, 'remove_from_dataframe': True})
    assert '[5]' in mito.transpiled_code[1]
    assert mito.dfs[0].equals(pd.DataFrame({'A': [5]}, index=[4]))


def test_edit_between_filter_and_bulk_filter_works():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1, 2, 3, 4, 5]}))
    mito.filter(0, 'A', 'And', FC_NUMBER_GREATER, 2)
    mito.add_column(0, 'B')
    mito.bulk_filter(0, 'A', {'type': BULK_FILTER_TOGGLE_SPECIFIC_VALUE, 'value': 4, 'remove_from_dataframe': True})

    assert mito.dfs[0].equals(pd.DataFrame({'A': [3, 5], 'B': [0, 0]}, index=[2, 4]))
