#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for new column creation.
"""
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_with_data, create_mito_wrapper

def test_creates_row_on_row_creation_message():
    mito = create_mito_wrapper_with_data([123])
    mito.add_column(0, 'B')
    assert 'B' in mito.dfs[0]


def test_can_set_row_after_creation_message():
    mito = create_mito_wrapper_with_data([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(mito.dfs[0]['A'])


def test_create_mulitple_columns():
    mito = create_mito_wrapper_with_data([123])
    from string import ascii_lowercase

    for letter in ascii_lowercase:
        mito.add_column(0, letter)
    
    for letter in ascii_lowercase:
        assert letter in mito.dfs[0]


def test_create_column_mulitple_times():
    mito = create_mito_wrapper_with_data([123])

    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')
    mito.add_column(0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(mito.dfs[0]['A'])

def test_multi_sheet_add_columns_correct_dfs():
    df1 = pd.DataFrame(data={'A': [1]})
    df2 = pd.DataFrame(data={'A': [2]})

    mito = create_mito_wrapper(df1, df2)
    mito.add_column(0, 'B')
    mito.add_column(1, 'C')

    assert 'B' in mito.dfs[0]
    assert 'C' in mito.dfs[1]


def test_add_column_and_then_delete():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df)
    mito.add_column(0, 'B')
    mito.delete_dataframe(0)

    curr_step = mito.curr_step
    for key, value in curr_step.__dict__.items():
        # Check we have deleted from all the lists
        if isinstance(value, list):
            assert len(value) == 0

    assert mito.transpiled_code == []

def test_add_column_in_middle():
    df = pd.DataFrame({'A': [123], 'B': [123]})
    mito = create_mito_wrapper(df)
    mito.add_column(0, 'C', 1)

    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [123],
        'C': [0],
        'B': [123],
    }))

def test_add_multiple_columns_in_middle():
    df = pd.DataFrame({'A': [123], 'B': [123]})
    mito = create_mito_wrapper(df)
    mito.add_column(0, 'C', 1)
    mito.add_column(0, 'D', 1)
    mito.add_column(0, 'E', 2)

    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [123],
        'D': [0],
        'E': [0],
        'C': [0],
        'B': [123],
    }))


def test_add_column_out_of_bounds():
    df = pd.DataFrame({'A': [123], 'B': [123]})
    mito = create_mito_wrapper(df)
    mito.add_column(0, 'C', -2)
    mito.add_column(0, 'D', 10)

    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [123],
        'B': [123],
        'C': [0],
        'D': [0]
    }))

def test_add_then_delete_optimizes():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'B')
    mito.delete_columns(0, ['B'])

    assert mito.transpiled_code == []

    
def test_add_then_delete_multiple_optimizes():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.delete_columns(0, ['B', 'C'])

    assert mito.transpiled_code == []

def test_add_then_rename_multiple_optimizes():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'B')
    mito.rename_column(0, 'B', 'C')

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1.insert(1, 'C', 0)",
        ''
    ]

def test_add_then_rename_then_delete_optimizes():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'B')
    mito.rename_column(0, 'B', 'C')
    mito.delete_columns(0, ['C'])

    assert mito.transpiled_code == []

def test_add_then_rename_then_set_formula_optimizes():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'B')
    mito.rename_column(0, 'B', 'C')
    mito.set_formula('=10', 0, 'C', add_column=False)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1.insert(1, 'C', 10)",
        '',
    ]

def test_add_then_rename_then_set_formula_then_delete_optimizes():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'B')
    mito.rename_column(0, 'B', 'C')
    mito.set_formula('=10', 0, 'C', add_column=False)
    mito.delete_columns(0, ['C'])

    assert mito.transpiled_code == []

def test_add_then_rename_then_set_formula_then_multiple_delete_optimizes():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'D')
    mito.add_column(0, 'B')
    mito.rename_column(0, 'B', 'C')
    mito.set_formula('=10', 0, 'C', add_column=False)
    mito.delete_columns(0, ['C', 'D'])

    assert mito.transpiled_code == []

    
def test_add_then_rename_multiple_then_set_formula_then_delete_optimizes():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'B')
    mito.add_column(0, 'BB')
    mito.rename_column(0, 'B', 'C')
    mito.rename_column(0, 'BB', 'CC')
    mito.set_formula('=10', 0, 'C', add_column=False)
    mito.delete_columns(0, ['C', 'CC'])

    assert mito.transpiled_code == []

def test_add_then_set_formula_then_rename_optimizes():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'B')
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.rename_column(0, 'B', 'C')

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1.insert(1, 'C', 10)",
        '',
    ]

def test_add_then_set_formula_then_rename_then_delete_optimizes():
    mito = create_mito_wrapper_with_data([1])
    mito.add_column(0, 'B')
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.rename_column(0, 'B', 'C')
    mito.delete_columns(0, ['A', 'C'])

    assert mito.dfs[0].empty
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1.drop(['A'], axis=1, inplace=True)",
        '',
    ]

    
def test_add_then_set_formula_then_rename_then_delete_diff_sheet_optimizes_by_reorder():
    mito = create_mito_wrapper_with_data([1])
    mito.duplicate_dataframe(0)
    mito.add_column(1, 'B')
    mito.rename_column(1, 'B', 'C')
    mito.add_column(0, 'B')
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.rename_column(0, 'B', 'C')
    mito.delete_columns(1, ['A', 'C'])

    assert not mito.dfs[0].empty
    assert mito.dfs[1].empty
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        "df1_copy = df1.copy(deep=True)",
        '',
        "df1_copy.drop(['A'], axis=1, inplace=True)",
        '',
        "df1.insert(1, 'C', 10)",
        '',
    ]

    
def test_add_then_set_formula_then_rename_then_delete_sheet_does_optimize():
    mito = create_mito_wrapper_with_data([1])
    mito.duplicate_dataframe(0)
    mito.add_column(1, 'B')
    mito.rename_column(1, 'B', 'C')
    mito.add_column(0, 'B')
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.rename_column(0, 'B', 'C')
    mito.delete_columns(1, ['A', 'C'])
    mito.delete_dataframe(0)
    mito.delete_dataframe(0)

    assert mito.transpiled_code == []

def test_add_then_set_formula_then_rename_then_delete_different_sheet_does_not_optimize():
    mito = create_mito_wrapper_with_data([1])
    mito.duplicate_dataframe(0)
    mito.add_column(1, 'B')
    mito.rename_column(1, 'B', 'C')
    mito.add_column(0, 'B')
    mito.set_formula('=10', 0, 'B', add_column=False)
    mito.rename_column(0, 'B', 'C')
    mito.delete_columns(1, ['A', 'C'])
    mito.delete_dataframe(1)

    assert len(mito.optimized_code_chunks) >= 3

    