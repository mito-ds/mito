#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains tests for new column creation.
"""
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper, create_mito_wrapper_dfs

def test_creates_row_on_row_creation_message():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    assert 'B' in mito.dfs[0]


def test_can_set_row_after_creation_message():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(mito.dfs[0]['A'])


def test_create_mulitple_columns():
    mito = create_mito_wrapper([123])
    from string import ascii_lowercase

    for letter in ascii_lowercase:
        mito.add_column(0, letter)
    
    for letter in ascii_lowercase:
        assert letter in mito.dfs[0]


def test_create_column_mulitple_times():
    mito = create_mito_wrapper([123])

    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')
    mito.add_column(0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(mito.dfs[0]['A'])

def test_multi_sheet_add_columns_correct_dfs():
    df1 = pd.DataFrame(data={'A': [1]})
    df2 = pd.DataFrame(data={'A': [2]})

    mito = create_mito_wrapper_dfs(df1, df2)
    mito.add_column(0, 'B')
    mito.add_column(1, 'C')

    assert 'B' in mito.dfs[0]
    assert 'C' in mito.dfs[1]


def test_add_column_and_then_delete():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df)
    mito.add_column(0, 'B')
    mito.delete_dataframe(0)

    curr_step = mito.curr_step
    for key, value in curr_step.__dict__.items():
        # Check we have deleted from all the lists
        if isinstance(value, list):
            assert len(value) == 0

    assert mito.transpiled_code == [
        'df1.insert(1, \'B\', 0)',
        'del df1'
    ]

def test_add_column_in_middle():
    df = pd.DataFrame({'A': [123], 'B': [123]})
    mito = create_mito_wrapper_dfs(df)
    mito.add_column(0, 'C', 1)

    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [123],
        'C': [0],
        'B': [123],
    }))

def test_add_multiple_columns_in_middle():
    df = pd.DataFrame({'A': [123], 'B': [123]})
    mito = create_mito_wrapper_dfs(df)
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
    mito = create_mito_wrapper_dfs(df)
    mito.add_column(0, 'C', -2)
    mito.add_column(0, 'D', 10)

    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [123],
        'B': [123],
        'C': [0],
        'D': [0]
    }))