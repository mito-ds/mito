#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for merging events.
"""
from cmath import exp
import numpy as np
import pytest
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper, make_multi_index_header_df
from mitosheet.tests.decorators import pandas_post_1_only

MERGE_TESTS = [
    (
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]})
        ],
        'lookup', 0, 1, [['A', 'A']], ['A', 'B'], ['A', 'C'],
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]}),
            pd.DataFrame({'A': [1], 'B': [2], 'C': [3]})
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]})
        ],
        'lookup', 0, 1, [['A', 'A'], ['B', 'C']], ['A', 'B'], ['A', 'C'],
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]}),
            pd.DataFrame({'A': [1], 'B': [2], 'C': [np.nan]})
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]})
        ],
        'left', 0, 1, [['A', 'A'], ['B', 'C']], ['A', 'B'], ['A', 'C'],
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]}),
            pd.DataFrame({'A': [1], 'B': [2], 'C': [np.nan]})
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]})
        ],
        'right', 0, 1, [['A', 'A'], ['B', 'C']], ['A', 'B'], ['A', 'C'],
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]}),
            pd.DataFrame({'A': [1], 'B': [np.nan], 'C': [3]})
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]})
        ],
        'inner', 0, 1, [['A', 'A'], ['B', 'C']], ['A', 'B'], ['A', 'C'],
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]}),
            pd.DataFrame({'A': [], 'B': [], 'C': []}, index=pd.Index([], dtype='object'), dtype='int64')
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]})
        ],
        'outer', 0, 1, [['A', 'A'], ['B', 'C']], ['A', 'B'], ['A', 'C'],
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]}),
            pd.DataFrame({'A': [1, 1], 'B': [2.0, np.nan], 'C': [np.nan, 3.0]})
        ],
    ),
    (
        [
            pd.DataFrame({'product_id': [1, 2, 3, 4, 5, 6, 7, 8, 9], 'description': ["a cat", "a bat", "a rat", "dont ask", "beer", "other thing", "my smelly shoes", "tickets to basketball games (we love)", "no"], pd.to_datetime('1-1-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-2-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-3-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-4-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-5-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-6-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8]}),
            pd.DataFrame({'product_id': [1, 2, 3, 4, 5, 6, 7, 8, 9], 'description': ["a cat", "a mat", "a rat", "dont ask", "beer", "other thing", "my smelly shoes", "tickets to basketball games (we love)", "no"], pd.to_datetime('1-1-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-2-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-3-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-4-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-5-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-6-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8]})
        ],
        'inner', 0, 1, [['product_id', 'product_id'], ['description', 'description']], ['product_id', 'description', pd.to_datetime('1-1-2020'), pd.to_datetime('1-2-2020'), pd.to_datetime('1-3-2020'), pd.to_datetime('1-4-2020'), pd.to_datetime('1-5-2020'), pd.to_datetime('1-6-2020')], ['product_id', 'description'],
        [
            pd.DataFrame({'product_id': [1, 2, 3, 4, 5, 6, 7, 8, 9], 'description': ["a cat", "a bat", "a rat", "dont ask", "beer", "other thing", "my smelly shoes", "tickets to basketball games (we love)", "no"], pd.to_datetime('1-1-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-2-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-3-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-4-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-5-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-6-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8]}),
            pd.DataFrame({'product_id': [1, 2, 3, 4, 5, 6, 7, 8, 9], 'description': ["a cat", "a mat", "a rat", "dont ask", "beer", "other thing", "my smelly shoes", "tickets to basketball games (we love)", "no"], pd.to_datetime('1-1-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-2-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-3-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-4-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-5-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-6-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8]}),
            pd.DataFrame({'product_id': [1, 3, 4, 5, 6, 7, 8, 9], 'description': ["a cat", "a rat", "dont ask", "beer", "other thing", "my smelly shoes", "tickets to basketball games (we love)", "no"], pd.to_datetime('1-1-2020'): [0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-2-2020'): [0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-3-2020'): [0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-4-2020'): [0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-5-2020'): [0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-6-2020'): [0, 1, 1, 3, 5, 6, 7, 8]}),
        ],
    ),
    # Ensure that if merge keys are not in the selected columns, they are still added
    (
        [
            pd.DataFrame({'product_id': [1, 2, 3, 4, 5, 6, 7, 8, 9], 'description': ["a cat", "a bat", "a rat", "dont ask", "beer", "other thing", "my smelly shoes", "tickets to basketball games (we love)", "no"], pd.to_datetime('1-1-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-2-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-3-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-4-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-5-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-6-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8]}),
            pd.DataFrame({'product_id': [1, 2, 3, 4, 5, 6, 7, 8, 9], 'description': ["a cat", "a mat", "a rat", "dont ask", "beer", "other thing", "my smelly shoes", "tickets to basketball games (we love)", "no"], pd.to_datetime('1-1-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-2-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-3-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-4-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-5-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-6-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8]})
        ],
        'inner', 0, 1, [['product_id', 'product_id'], ['description', 'description']], [pd.to_datetime('1-1-2020'), pd.to_datetime('1-2-2020'), pd.to_datetime('1-3-2020'), pd.to_datetime('1-4-2020'), pd.to_datetime('1-5-2020'), pd.to_datetime('1-6-2020')], [],
        [
            pd.DataFrame({'product_id': [1, 2, 3, 4, 5, 6, 7, 8, 9], 'description': ["a cat", "a bat", "a rat", "dont ask", "beer", "other thing", "my smelly shoes", "tickets to basketball games (we love)", "no"], pd.to_datetime('1-1-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-2-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-3-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-4-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-5-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-6-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8]}),
            pd.DataFrame({'product_id': [1, 2, 3, 4, 5, 6, 7, 8, 9], 'description': ["a cat", "a mat", "a rat", "dont ask", "beer", "other thing", "my smelly shoes", "tickets to basketball games (we love)", "no"], pd.to_datetime('1-1-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-2-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-3-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-4-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-5-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-6-2020'): [0, 0, 1, 1, 3, 5, 6, 7, 8]}),
            pd.DataFrame({'product_id': [1, 3, 4, 5, 6, 7, 8, 9], 'description': ["a cat", "a rat", "dont ask", "beer", "other thing", "my smelly shoes", "tickets to basketball games (we love)", "no"], pd.to_datetime('1-1-2020'): [0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-2-2020'): [0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-3-2020'): [0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-4-2020'): [0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-5-2020'): [0, 1, 1, 3, 5, 6, 7, 8], pd.to_datetime('1-6-2020'): [0, 1, 1, 3, 5, 6, 7, 8]}),
        ],
    ),
]
@pytest.mark.parametrize("input_dfs, how, sheet_index_one, sheet_index_two, merge_key_columns, selected_columns_one, selected_columns_two, output_dfs", MERGE_TESTS)
def test_merge(input_dfs, how, sheet_index_one, sheet_index_two, merge_key_columns, selected_columns_one, selected_columns_two, output_dfs):
    mito = create_mito_wrapper(*input_dfs)

    mito.merge_sheets(
        how, sheet_index_one, sheet_index_two, merge_key_columns, selected_columns_one, selected_columns_two
    )

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)

MERGE_UNIQUE_TESTS = [
    (
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]})
        ],
        'unique in left', 0, 1, [['A', 'A'], ['B', 'C']], ['A', 'B'], ['A', 'C'],
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]}),
            pd.DataFrame({'A': [1], 'B': [2]})
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]})
        ],
        'unique in right', 0, 1, [['A', 'A'], ['B', 'C']], ['A', 'B'], ['A', 'C'],
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [3]}),
            pd.DataFrame({'A': [1], 'C': [3]})
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'A': [1,1,2], 'B': [5,4,3]})
        ],
        'unique in left', 0, 1, [['A', 'A'], ['B', 'B']], ['A', 'B'], ['A', 'B'],
        [
            pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'A': [1,1,2], 'B': [5,4,3]}),
            pd.DataFrame({'A': [2,3], 'B': [5,6]}),
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'A': [1,1,2], 'B': [5,4,3]})
        ],
        'unique in right', 0, 1, [['A', 'A'], ['B', 'B']], ['A', 'B'], ['A', 'B'],
        [
            pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'A': [1,1,2], 'B': [5,4,3]}),
            pd.DataFrame({'A': [1,2], 'B': [5,3]}),
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'C': [1,1,2], 'D': [5,4,3]})
        ],
        'unique in left', 0, 1, [['A', 'C'], ['B', 'D']], ['A', 'B'], ['C', 'D'],
        [
            pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'C': [1,1,2], 'D': [5,4,3]}),
            pd.DataFrame({'A': [2,3], 'B': [5,6]}),
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'C': [1,1,2], 'D': [5,4,3]})
        ],
        'unique in right', 0, 1, [['A', 'C'], ['B', 'D']], ['A', 'B'], ['C', 'D'],
        [
            pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'C': [1,1,2], 'D': [5,4,3]}),
            pd.DataFrame({'C': [1,2], 'D': [5,3]}),
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1], 'B': [np.nan]}),
            pd.DataFrame({'A': [1], 'C': [3]})
        ],
        'unique in left', 0, 1, [['A', 'A'], ['B', 'C']], ['A', 'B'], ['A', 'C'],
        [
            pd.DataFrame({'A': [1], 'B': [np.nan]}),
            pd.DataFrame({'A': [1], 'C': [3]}),
            pd.DataFrame({'A': [1], 'B': [np.nan]})
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [np.nan]})
        ],
        'unique in right', 0, 1, [['A', 'A'], ['B', 'C']], ['A', 'B'], ['A', 'C'],
        [
            pd.DataFrame({'A': [1], 'B': [2]}),
            pd.DataFrame({'A': [1], 'C': [np.nan]}),
            pd.DataFrame({'A': [1], 'C': [np.nan]})
        ],
    ),
    (
        [
            pd.DataFrame({'A': [np.nan,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'C': [1,1,2], 'D': [5,4,3]})
        ],
        'unique in left', 0, 1, [['A', 'C'], ['B', 'D']], ['A', 'B'], ['C', 'D'],
        [
            pd.DataFrame({'A': [np.nan,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'C': [1,1,2], 'D': [5,4,3]}),
            pd.DataFrame({'A': [np.nan, 2,3], 'B': [4,5,6]}),
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'C': [1,np.nan,2], 'D': [5,4,3]})
        ],
        'unique in right', 0, 1, [['A', 'C'], ['B', 'D']], ['A', 'B'], ['C', 'D'],
        [
            pd.DataFrame({'A': [1,2,3], 'B': [4,5,6]}),
            pd.DataFrame({'C': [1,np.nan,2], 'D': [5,4,3]}),
            pd.DataFrame({'C': [1,np.nan,2], 'D': [5,4,3]}),
        ],
    ),
    (
        [
            pd.DataFrame({'A': [4]}, index=[2]),
            pd.DataFrame({'A': [1, 2, 3]}),
        ],
        'unique in left', 0, 1, [['A', 'A']], ['A'], ['A'],
        [
            pd.DataFrame({'A': [4]}, index=[2]),
            pd.DataFrame({'A': [1, 2, 3]}),
            pd.DataFrame({'A': [4]}),
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]}),
            pd.DataFrame({'A': [4]}, index=[2]),
        ],
        'unique in right', 0, 1, [['A', 'A']], ['A'], ['A'],
        [
            pd.DataFrame({'A': [1, 2, 3]}),
            pd.DataFrame({'A': [4]}, index=[2]),
            pd.DataFrame({'A': [4]}),
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3]}),
            pd.DataFrame({'B': [4]}, index=[2]),
        ],
        'unique in right', 0, 1, [['A', 'B']], ['A'], ['B'],
        [
            pd.DataFrame({'A': [1, 2, 3]}),
            pd.DataFrame({'B': [4]}, index=[2]),
            pd.DataFrame({'B': [4]}),
        ],
    ),
    (
        [
            pd.DataFrame({'A': [1, 2], 'B': [1, 2]}),
            pd.DataFrame({'A': [2], 'B': [2]})
        ],
        'unique in left', 0, 1, [['A', 'B']], ['A', 'B'], ['A', 'B'],
        [
            pd.DataFrame({'A': [1, 2], 'B': [1, 2]}),
            pd.DataFrame({'A': [2], 'B': [2]}),
            pd.DataFrame({'A': [1], 'B': [1]})
        ],
    ),
    (
        [
            pd.DataFrame({'A': [2], 'B': [2]}),
            pd.DataFrame({'A': [1, 2], 'B': [1, 2]}),
        ],
        'unique in right', 0, 1, [['B', 'A']], ['A', 'B'], ['A', 'B'],
        [
            pd.DataFrame({'A': [2], 'B': [2]}),
            pd.DataFrame({'A': [1, 2], 'B': [1, 2]}),
            pd.DataFrame({'A': [1], 'B': [1]})
        ],
    ),
]
@pandas_post_1_only
@pytest.mark.parametrize("input_dfs, how, sheet_index_one, sheet_index_two, merge_key_columns, selected_columns_one, selected_columns_two, output_dfs", MERGE_UNIQUE_TESTS)
def test_merge_unique(input_dfs, how, sheet_index_one, sheet_index_two, merge_key_columns, selected_columns_one, selected_columns_two, output_dfs):
    mito = create_mito_wrapper(*input_dfs)

    mito.merge_sheets(
        how, sheet_index_one, sheet_index_two, merge_key_columns, selected_columns_one, selected_columns_two
    )

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        print(actual)
        print(expected)
        assert actual.equals(expected)


def test_simple_merge_edit():
    df1 = pd.DataFrame({'A': [2], 'B': [2]})
    df2 = pd.DataFrame({'A': [1, 2], 'B': [1, 2]})
    mito = create_mito_wrapper(df1, df2)
    mito.merge_sheets('inner', 0, 1, [['A', 'A']], ['A', 'B'], ['A', 'B'])
    mito.merge_sheets('inner', 0, 1, [['B', 'B']], ['A', 'B'], ['A', 'B'], destination_sheet_index=2)
    pd.testing.assert_frame_equal(mito.dfs[2], pd.DataFrame({'A_df1': [2], 'B': [2], 'A_df2': [2]}))
    assert len(mito.dfs) == 3

def test_merge_two_edits():
    df1 = pd.DataFrame({'A': [2], 'B': [2]})
    df2 = pd.DataFrame({'A': [1, 2], 'B': [1, 2]})
    mito = create_mito_wrapper(df1, df2)
    mito.merge_sheets('inner', 0, 1, [['A', 'A']], ['A', 'B'], ['A', 'B'])
    mito.merge_sheets('inner', 0, 1, [['B', 'B']], ['A', 'B'], ['A', 'B'], destination_sheet_index=2)
    mito.merge_sheets('outer', 0, 1, [['B', 'B']], ['A', 'B'], ['A', 'B'], destination_sheet_index=2)
    pd.testing.assert_frame_equal(mito.dfs[2], pd.DataFrame({'A_df1': [2.0, None], 'B': [2, 1], 'A_df2': [2, 1]}))
    assert len(mito.dfs) == 3

def test_merge_edit_with_deletion():
    df1 = pd.DataFrame({'A': [2], 'B': [2]})
    df2 = pd.DataFrame({'A': [1, 2], 'B': [1, 2]})
    mito = create_mito_wrapper(df1, df2)
    mito.merge_sheets('inner', 0, 1, [['A', 'A']], ['A', 'B'], ['A', 'B'])
    mito.merge_sheets('inner', 0, 1, [['B', 'B']], ['A', 'B'], ['A', 'B'], destination_sheet_index=2)
    mito.delete_columns(2, ['A_df1'])
    pd.testing.assert_frame_equal(mito.dfs[2], pd.DataFrame({'B': [2], 'A_df2': [2]}))
    assert len(mito.dfs) == 3

def test_merge_edit_with_deletion_overwrite():
    df1 = pd.DataFrame({'A': [2], 'B': [2]})
    df2 = pd.DataFrame({'A': [1, 2], 'B': [1, 2]})
    mito = create_mito_wrapper(df1, df2)
    mito.merge_sheets('inner', 0, 1, [['A', 'A']], ['A', 'B'], ['A', 'B'])
    mito.delete_columns(2, ['B_df1'])
    mito.merge_sheets('inner', 0, 1, [['B', 'B']], ['A', 'B'], ['A', 'B'], destination_sheet_index=2)
    pd.testing.assert_frame_equal(mito.dfs[2], pd.DataFrame({'A_df1': [2], 'B': [2], 'A_df2': [2]}))
    assert len(mito.dfs) == 3

def test_merge_edit_different_selected_columns():
    df1 = pd.DataFrame({'A': [2], 'B': [2]})
    df2 = pd.DataFrame({'A': [1, 2], 'B': [1, 2]})
    mito = create_mito_wrapper(df1, df2)
    mito.merge_sheets('inner', 0, 1, [['A', 'A']], ['A', 'B'], ['A', 'B'])
    mito.merge_sheets('inner', 0, 1, [['A', 'A']], ['A', 'B'], ['A'], destination_sheet_index=2)
    pd.testing.assert_frame_equal(mito.dfs[2], pd.DataFrame({'A': [2], 'B': [2]}))
    assert len(mito.dfs) == 3

OTHER_MERGE_TESTS = [
    (
        'lookup',
        pd.DataFrame({'A': [1]}),
        'A',
        pd.DataFrame({'A': [1]}),
        'A',
        pd.DataFrame({'A': [1]}),
    ),
    (
        'lookup',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'A', 'B', 'B', 'C', 'D'], 'value': [5, 6, 7, 8, 9, 10]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', 'B', 'C', 'D'], 
            'value_df1': [1, 2, 3, 4],
            'Key2': ['A', 'B', 'C', 'D'],
            'value_df2': [5, 7, 9, 10]
            })
    ),
    (
        'lookup',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'A', 'B', 'B'], 'value': [5, 6, 7, 8]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', 'B', 'C', 'D'], 
            'value_df1': [1, 2, 3, 4],
            'Key2': ['A', 'B', None, None],
            'value_df2': [5, 7, None, None]
            })
    ),
    (
        'lookup',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'A', 'B', 'B', 'F'], 'value': [5, 6, 7, 8, 9]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', 'B', 'C', 'D'], 
            'value_df1': [1, 2, 3, 4],
            'Key2': ['A', 'B', None, None],
            'value_df2': [5, 7, None, None]
            })
    ),
    (
        'lookup',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'X', 'X', 'X', 'X', 'X'], 'value': [5, 5, 6, 7, 8, 9]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', 'B', 'C', 'D'], 
            'value_df1': [1, 2, 3, 4],
            'Key2': ['A', None, None, None],
            'value_df2': [5, None, None, None]
            })
    ),
    (
        'left',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'A', 'X', 'X', 'X', 'X'], 'value': [5, 1, 6, 7, 8, 9]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', 'A', 'B', 'C', 'D'], 
            'value_df1': [1, 1, 2, 3, 4],
            'Key2': ['A', 'A', None, None, None],
            'value_df2': [5, 1, None, None, None]
            })
    ),
    (
        'left',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'A', 'B', 'B', 'X', 'X'], 'value': [5, 1, 6, 7, 8, 9]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', 'A', 'B', 'B', 'C', 'D'], 
            'value_df1': [1, 1, 2, 2, 3, 4],
            'Key2': ['A', 'A', 'B', 'B', None, None],
            'value_df2': [5, 1, 6, 7, None, None]
            })
    ),
    (
        'left',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'X', 'X', 'X', 'X', 'X'], 'value': [5, 1, 6, 7, 8, 9]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', 'B', 'C', 'D'], 
            'value_df1': [1, 2, 3, 4],
            'Key2': ['A', None, None, None],
            'value_df2': [5, None, None, None]
            })
    ),
    (
        'right',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'A', 'X', 'X'], 'value': [5, 1, 6, 7]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', 'A', None, None,], 
            'value_df1': [1, 1, None, None],
            'Key2': ['A', 'A', 'X', 'X'],
            'value_df2': [5, 1, 6, 7]
            })
    ),
    (
        'right',
        pd.DataFrame({'Key1': ['A', 'A', 'B', 'B', 'X', 'X'], 'value': [5, 1, 6, 7, 8, 9]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', 'A', 'B', 'B', None, None], 
            'value_df1': [5, 1, 6, 7, None, None],
            'Key2': ['A', 'A', 'B', 'B', 'C', 'D'],
            'value_df2': [1, 1, 2, 2, 3, 4]
            })
    ),
    (
        'right',
        pd.DataFrame({'Key1': ['A', 'X', 'X', 'X', 'X', 'X'], 'value': [5, 1, 6, 7, 8, 9]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', None, None, None], 
            'value_df1': [5, None, None, None],
            'Key2': ['A', 'B', 'C', 'D'],
            'value_df2': [1, 2, 3, 4]
            })
    ),
    (
        'inner',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'A', 'X', 'X'], 'value': [5, 1, 6, 7]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', 'A'], 
            'value_df1': [1, 1],
            'Key2': ['A', 'A'],
            'value_df2': [5, 1]
            })
    ),
    (
        'outer',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'A', 'X', 'Y'], 'value': [5, 1, 6, 7]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['A', 'A', 'B', 'C', 'D', None, None], 
            'value_df1': [1, 1, 2, 3, 4, None, None],
            'Key2': ['A', 'A', None, None, None, 'X', 'Y'],
            'value_df2': [5, 1, None, None, None, 6, 7]
            })
    ),
]
@pytest.mark.parametrize("how,df_one,key_one,df_two,key_two,merged", OTHER_MERGE_TESTS)
def test_merge_all_columns(how, df_one, key_one, df_two, key_two, merged):
    mito = create_mito_wrapper(df_one, df_two)
    mito.merge_sheets(how, 0, 1, [[key_one, key_two]], list(df_one.keys()), list(df_two.keys()))

    assert mito.dfs[2].equals(merged)

OTHER_MERGE_UNIQUE_TESTS = [
        (
        'unique in left',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'A', 'X', 'Y'], 'value': [5, 1, 6, 7]}),
        'Key2',
        pd.DataFrame({
            'Key1': ['B', 'C', 'D'], 
            'value': [2, 3, 4],
        })
    ),
    (
        'unique in right',
        pd.DataFrame({'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame({'Key2': ['A', 'A', 'X', 'Y'], 'value': [5, 1, 6, 7]}),
        'Key2',
        pd.DataFrame({
            'Key2': ['X', 'Y'], 
            'value': [6, 7],
        })
    ),
]
@pandas_post_1_only
@pytest.mark.parametrize("how,df_one,key_one,df_two,key_two,merged", OTHER_MERGE_TESTS)
def test_merge_unique_all_columns(how, df_one, key_one, df_two, key_two, merged):
    mito = create_mito_wrapper(df_one, df_two)
    mito.merge_sheets(how, 0, 1, [[key_one, key_two]], list(df_one.keys()), list(df_two.keys()))

    assert mito.dfs[2].equals(merged)


MERGE_PARTIAL_TESTS = [
    (
        'lookup',
        pd.DataFrame({'A': [1]}),
        'A',
        ['A'],
        pd.DataFrame({'A': [1], 'B': [100]}),
        'A',
        ['A'],
        pd.DataFrame({'A': [1]}),
    ),
    (
        'lookup',
        pd.DataFrame({'A': [1], 'B': [100]}),
        'A',
        ['A'],
        pd.DataFrame({'A': [1], 'B': [100]}),
        'A',
        ['A'],
        pd.DataFrame({'A': [1]}),
    ),
    (
        'lookup',
        pd.DataFrame({'A': [1], 'B': [101], 'C': [11]}),
        'A',
        ['A', 'C'],
        pd.DataFrame({'A': [1], 'B': [100]}),
        'A',
        ['A', 'B'],
        pd.DataFrame({'A': [1], 'C': [11], 'B': [100]}),
    ),
    (
        'lookup',
        pd.DataFrame({'A': [1], 'B': [101], 'C': [11]}),
        'A',
        ['A', 'B'],
        pd.DataFrame({'A': [1], 'B': [100], 'C': [10]}),
        'A',
        ['A', 'C'],
        pd.DataFrame({'A': [1], 'B': [101], 'C': [10]}),
    ),
    (
        'lookup',
        pd.DataFrame({'A': [1], 'B': [101], 'C': [11]}),
        'A',
        ['A', 'B'],
        pd.DataFrame({'A': [1], 'B': [100], 'C': [10]}),
        'A',
        ['A', 'B'],
        pd.DataFrame({'A': [1], 'B_df1': [101], 'B_df2': [100]}),
    ),
    
]
@pytest.mark.parametrize("how,df_one,key_one,columns_one,df_two,key_two,columns_two,merged", MERGE_PARTIAL_TESTS)
def test_merge_remove_some_columns(how,df_one, key_one, columns_one, df_two, key_two, columns_two, merged):
    mito = create_mito_wrapper(df_one, df_two)
    mito.merge_sheets(how, 0, 1, [[key_one, key_two]], columns_one, columns_two)

    assert mito.dfs[2].equals(merged)

def test_incompatible_merge_key_types_error():
    df_one = pd.DataFrame({'A_string': ['Aaron'], 'B': [101], 'C': [11]})
    df_two = pd.DataFrame({'A_number': [1.5], 'D': [100], 'E': [10]})
    mito = create_mito_wrapper(df_one, df_two)

    mito.merge_sheets('lookup', 0, 1, [['A_string', 'A_number']], list(df_one.keys()), list(df_two.keys()))  

    assert mito.transpiled_code == []

def test_delete_merged_sheet_optimizes():
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df2 = pd.DataFrame({'A': [1], 'C': [3]})
    mito = create_mito_wrapper(df1, df2)

    mito.merge_sheets(
        'lookup', 0, 1, [['A', 'A']], ['A', 'B'], ['A', 'C']
    )
    mito.delete_dataframe(2)
    assert mito.transpiled_code == []

def test_delete_source_of_merged_sheet_no_optimizes():
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df2 = pd.DataFrame({'A': [1], 'C': [3]})
    mito = create_mito_wrapper(df1, df2)

    mito.merge_sheets(
        'lookup', 0, 1, [['A', 'A']], ['A', 'B'], ['A', 'C']
    )
    mito.delete_dataframe(1)

    assert len(mito.transpiled_code) > 0