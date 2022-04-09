#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for a column rename.
"""

import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper, create_mito_wrapper_dfs


def test_delete_works():
    mito = create_mito_wrapper([1])
    mito.delete_columns(0, ['A'])
    assert mito.dfs[0].empty

def test_delete_cannot_delete_invalid_column():
    mito = create_mito_wrapper([1])
    try:
        mito.delete_columns(0, ['B'])
    except:
        pass
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))

def test_delete_cannot_delete_with_references():
    mito = create_mito_wrapper([1])
    mito.set_formula('=A + 1', 0, 'B', add_column=True)
    mito.delete_columns(0, ['A'])
    assert mito.dfs[0].equals(pd.DataFrame({'A': [1], 'B': [2]}))

def test_delete_multiple_columns():
    mito = create_mito_wrapper([1])
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.delete_columns(0, ['B', 'C'])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))

def test_deletes_in_correct_order():
    mito = create_mito_wrapper([1])
    mito.add_column(0, 'C')
    mito.set_formula('=A + 1', 0, 'B', add_column=True)
    mito.delete_columns(0, ['A', 'B'])

    assert mito.dfs[0].equals(pd.DataFrame({'C': [0]}))

    mito = create_mito_wrapper([1])
    mito.add_column(0, 'C')
    mito.set_formula('=A + 1', 0, 'B', add_column=True)
    mito.delete_columns(0, ['B', 'A'])

    assert mito.dfs[0].equals(pd.DataFrame({'C': [0]}))


def test_does_not_delete_if_one_column_has_dependants():
    mito = create_mito_wrapper([1])
    mito.add_column(0, 'C')
    mito.set_formula('=A + 1', 0, 'B', add_column=True)
    mito.delete_columns(0, ['A', 'C'])

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1], 'C': [0], 'B': [2]}))


def test_create_delete_then_create():
    mito = create_mito_wrapper([1])
    mito.set_formula('=A + 1', 0, 'B', add_column=True)
    mito.delete_columns(0, 'B')
    mito.set_formula('=A + 2', 0, 'B', add_column=True)

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1], 'B': [3]}))

def test_double_delete_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [123], 'B': [1234]}))
    mito.delete_columns(0, ['A'])
    mito.delete_columns(0, ['B'])

    assert mito.dfs[0].empty
    assert mito.transpiled_code == [
        "df1.drop(['A', 'B'], axis=1, inplace=True)"
    ]

def test_multi_delete_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [123], 'B': [1234], 'C': [12345], 'D': [12346]}))
    mito.delete_columns(0, ['A'])
    mito.delete_columns(0, ['B'])
    mito.delete_columns(0, ['C', 'D'])

    assert mito.dfs[0].empty
    assert mito.transpiled_code == [
        "df1.drop(['A', 'B', 'C', 'D'], axis=1, inplace=True)"
    ]

def test_delete_different_sheets_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [123], 'B': [1234]}))
    mito.duplicate_dataframe(0)
    mito.delete_columns(0, ['A'])
    mito.delete_columns(1, ['B'])

    assert mito.transpiled_code == [
        "df1_copy = df1.copy(deep=True)",
        "df1.drop(['A'], axis=1, inplace=True)",
        "df1_copy.drop(['B'], axis=1, inplace=True)",
    ]

def test_double_delete_different_sheets_does_optimize():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [123], 'B': [1234]}))
    mito.duplicate_dataframe(0)
    mito.delete_columns(0, ['A'])
    mito.delete_columns(0, ['B'])
    mito.delete_columns(1, ['A'])
    mito.delete_columns(1, ['B'])

    assert mito.dfs[0].empty
    assert mito.dfs[1].empty
    assert mito.transpiled_code == [
        "df1_copy = df1.copy(deep=True)",
        "df1.drop(['A', 'B'], axis=1, inplace=True)",
        "df1_copy.drop(['A', 'B'], axis=1, inplace=True)",
    ]