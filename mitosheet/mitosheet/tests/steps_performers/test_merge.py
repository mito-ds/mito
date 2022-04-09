#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for merging events.
"""
import pytest
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_dfs, make_multi_index_header_df


def test_single_merge_simple_sheets_lookup():
    df1 = pd.DataFrame(data={'A': [1], 'B': [2]})
    df2 = pd.DataFrame(data={'A': [1], 'C': [3]})
    mito = create_mito_wrapper_dfs(df1, df2)

    mito.merge_sheets(
        'lookup', 0, 'A', ['A', 'B'], 1, 'A', ['A', 'C']
    )

    # Make sure the merged dataframe is actually correct!
    assert mito.dfs[2].equals(pd.DataFrame(data={'A': [1], 'B': [2], 'C': [3]}))

def test_double_merge_lookup():
    df1 = pd.DataFrame(data={'A': [1], 'B': [2]})
    df2 = pd.DataFrame(data={'A': [1], 'C': [3]})
    mito = create_mito_wrapper_dfs(df1, df2)
    # Add a column to df1 and df2
    mito.merge_sheets(
        'lookup', 0, 'A', ['A', 'B'], 1, 'A', ['A', 'C']
    )
    mito.merge_sheets(
        'lookup', 0, 'A', ['A', 'B'], 1, 'A', ['A', 'C']
    )

    # Make sure the merged dataframe is actually correct!
    assert mito.dfs[2].equals(pd.DataFrame(data={'A': [1], 'B': [2], 'C': [3]}))
    assert mito.dfs[3].equals(pd.DataFrame(data={'A': [1], 'B': [2], 'C': [3]}))


MERGE_TESTS = [
    (
        'lookup',
        pd.DataFrame(data={'A': [1]}),
        'A',
        pd.DataFrame(data={'A': [1]}),
        'A',
        pd.DataFrame(data={'A': [1]}),
    ),
    (
        'lookup',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'A', 'B', 'B', 'C', 'D'], 'value': [5, 6, 7, 8, 9, 10]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', 'B', 'C', 'D'], 
            'value_df1': [1, 2, 3, 4],
            'Key2': ['A', 'B', 'C', 'D'],
            'value_df2': [5, 7, 9, 10]
            })
    ),
    (
        'lookup',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'A', 'B', 'B'], 'value': [5, 6, 7, 8]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', 'B', 'C', 'D'], 
            'value_df1': [1, 2, 3, 4],
            'Key2': ['A', 'B', None, None],
            'value_df2': [5, 7, None, None]
            })
    ),
    (
        'lookup',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'A', 'B', 'B', 'F'], 'value': [5, 6, 7, 8, 9]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', 'B', 'C', 'D'], 
            'value_df1': [1, 2, 3, 4],
            'Key2': ['A', 'B', None, None],
            'value_df2': [5, 7, None, None]
            })
    ),
    (
        'lookup',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'X', 'X', 'X', 'X', 'X'], 'value': [5, 5, 6, 7, 8, 9]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', 'B', 'C', 'D'], 
            'value_df1': [1, 2, 3, 4],
            'Key2': ['A', None, None, None],
            'value_df2': [5, None, None, None]
            })
    ),
    (
        'left',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'A', 'X', 'X', 'X', 'X'], 'value': [5, 1, 6, 7, 8, 9]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', 'A', 'B', 'C', 'D'], 
            'value_df1': [1, 1, 2, 3, 4],
            'Key2': ['A', 'A', None, None, None],
            'value_df2': [5, 1, None, None, None]
            })
    ),
    (
        'left',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'A', 'B', 'B', 'X', 'X'], 'value': [5, 1, 6, 7, 8, 9]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', 'A', 'B', 'B', 'C', 'D'], 
            'value_df1': [1, 1, 2, 2, 3, 4],
            'Key2': ['A', 'A', 'B', 'B', None, None],
            'value_df2': [5, 1, 6, 7, None, None]
            })
    ),
    (
        'left',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'X', 'X', 'X', 'X', 'X'], 'value': [5, 1, 6, 7, 8, 9]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', 'B', 'C', 'D'], 
            'value_df1': [1, 2, 3, 4],
            'Key2': ['A', None, None, None],
            'value_df2': [5, None, None, None]
            })
    ),
    (
        'right',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'A', 'X', 'X'], 'value': [5, 1, 6, 7]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', 'A', None, None,], 
            'value_df1': [1, 1, None, None],
            'Key2': ['A', 'A', 'X', 'X'],
            'value_df2': [5, 1, 6, 7]
            })
    ),
    (
        'right',
        pd.DataFrame(data={'Key1': ['A', 'A', 'B', 'B', 'X', 'X'], 'value': [5, 1, 6, 7, 8, 9]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', 'A', 'B', 'B', None, None], 
            'value_df1': [5, 1, 6, 7, None, None],
            'Key2': ['A', 'A', 'B', 'B', 'C', 'D'],
            'value_df2': [1, 1, 2, 2, 3, 4]
            })
    ),
    (
        'right',
        pd.DataFrame(data={'Key1': ['A', 'X', 'X', 'X', 'X', 'X'], 'value': [5, 1, 6, 7, 8, 9]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', None, None, None], 
            'value_df1': [5, None, None, None],
            'Key2': ['A', 'B', 'C', 'D'],
            'value_df2': [1, 2, 3, 4]
            })
    ),
    (
        'inner',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'A', 'X', 'X'], 'value': [5, 1, 6, 7]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', 'A'], 
            'value_df1': [1, 1],
            'Key2': ['A', 'A'],
            'value_df2': [5, 1]
            })
    ),
    (
        'outer',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'A', 'X', 'Y'], 'value': [5, 1, 6, 7]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['A', 'A', 'B', 'C', 'D', None, None], 
            'value_df1': [1, 1, 2, 3, 4, None, None],
            'Key2': ['A', 'A', None, None, None, 'X', 'Y'],
            'value_df2': [5, 1, None, None, None, 6, 7]
            })
    ),
    (
        'unique in left',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'A', 'X', 'Y'], 'value': [5, 1, 6, 7]}),
        'Key2',
        pd.DataFrame(data={
            'Key1': ['B', 'C', 'D'], 
            'value': [2, 3, 4],
            }, index=[1,2,3])
    ),
    (
        'unique in right',
        pd.DataFrame(data={'Key1': ['A', 'B', 'C', 'D'], 'value': [1, 2, 3, 4]}),
        'Key1',
        pd.DataFrame(data={'Key2': ['A', 'A', 'X', 'Y'], 'value': [5, 1, 6, 7]}),
        'Key2',
        pd.DataFrame(data={
            'Key2': ['X', 'Y'], 
            'value': [6, 7],
            }, index=[2, 3])
    ),
]
@pytest.mark.parametrize("how,df_one,key_one,df_two,key_two,merged", MERGE_TESTS)
def test_merge_all_columns(how, df_one, key_one, df_two, key_two, merged):
    mito = create_mito_wrapper_dfs(df_one, df_two)
    mito.merge_sheets(how, 0, key_one, list(df_one.keys()), 1, key_two, list(df_two.keys()))

    assert mito.dfs[2].equals(merged)



MERGE_PARTIAL_TESTS = [
    (
        'lookup',
        pd.DataFrame(data={'A': [1]}),
        'A',
        ['A'],
        pd.DataFrame(data={'A': [1], 'B': [100]}),
        'A',
        ['A'],
        pd.DataFrame(data={'A': [1]}),
    ),
    (
        'lookup',
        pd.DataFrame(data={'A': [1], 'B': [100]}),
        'A',
        ['A'],
        pd.DataFrame(data={'A': [1], 'B': [100]}),
        'A',
        ['A'],
        pd.DataFrame(data={'A': [1]}),
    ),
    (
        'lookup',
        pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]}),
        'A',
        ['A', 'C'],
        pd.DataFrame(data={'A': [1], 'B': [100]}),
        'A',
        ['A', 'B'],
        pd.DataFrame(data={'A': [1], 'C': [11], 'B': [100]}),
    ),
    (
        'lookup',
        pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]}),
        'A',
        ['A', 'B'],
        pd.DataFrame(data={'A': [1], 'B': [100], 'C': [10]}),
        'A',
        ['A', 'C'],
        pd.DataFrame(data={'A': [1], 'B': [101], 'C': [10]}),
    ),
    (
        'lookup',
        pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]}),
        'A',
        ['A', 'B'],
        pd.DataFrame(data={'A': [1], 'B': [100], 'C': [10]}),
        'A',
        ['A', 'B'],
        pd.DataFrame(data={'A': [1], 'B_df1': [101], 'B_df2': [100]}),
    ),
    
]
@pytest.mark.parametrize("how,df_one,key_one,columns_one,df_two,key_two,columns_two,merged", MERGE_PARTIAL_TESTS)
def test_merge_remove_some_columns(how,df_one, key_one, columns_one, df_two, key_two, columns_two, merged):
    mito = create_mito_wrapper_dfs(df_one, df_two)
    mito.merge_sheets(how, 0, key_one, columns_one, 1, key_two, columns_two)

    assert mito.dfs[2].equals(merged)


def test_errors_dropping_merge_key():
    # NOTE: This also tests that an error during merge is rolled back
    # correctly!
    df_one = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    df_two = pd.DataFrame(data={'A': [1], 'B': [100], 'C': [10]})
    mito = create_mito_wrapper_dfs(df_one, df_two)

    mito.merge_sheets('lookup', 0, 'A', ['A', 'B'], 1, 'A', ['B', 'C'])

    assert len(mito.dfs) == 2
    assert mito.curr_step_idx == 0

def test_incompatible_merge_key_types_error():
    df_one = pd.DataFrame(data={'A_string': ['Aaron'], 'B': [101], 'C': [11]})
    df_two = pd.DataFrame(data={'A_number': [1.5], 'D': [100], 'E': [10]})
    mito = create_mito_wrapper_dfs(df_one, df_two)

    mito.merge_sheets('lookup', 0, 'A_string', list(df_one.keys()), 1, 'A_number', list(df_two.keys()))  

    assert mito.transpiled_code == []  


def test_merge_between_multi_index_and_non_errors():
    df_one = make_multi_index_header_df({0: [1, 2], 1: [3, 4]}, ['A', ('B', 'count')])
    df_two = pd.DataFrame({'A': [1, 2], 'B': [5, 6]})
    mito = create_mito_wrapper_dfs(df_one, df_two)
    mito.merge_sheets('lookup', 0, ('A', ''), list(df_one.keys()), 1, 'A', list(df_two.keys()))  

    assert len(mito.dfs) == 2

def test_delete_merged_sheet_optimizes():
    df1 = pd.DataFrame(data={'A': [1], 'B': [2]})
    df2 = pd.DataFrame(data={'A': [1], 'C': [3]})
    mito = create_mito_wrapper_dfs(df1, df2)

    mito.merge_sheets(
        'lookup', 0, 'A', ['A', 'B'], 1, 'A', ['A', 'C']
    )
    mito.delete_dataframe(2)
    assert mito.transpiled_code == []
