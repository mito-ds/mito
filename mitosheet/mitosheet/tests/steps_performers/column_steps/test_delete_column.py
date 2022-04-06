#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for a column rename.
"""

import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper


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