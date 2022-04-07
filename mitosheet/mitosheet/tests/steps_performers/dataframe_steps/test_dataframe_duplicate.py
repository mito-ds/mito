#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for dataframe_duplicate
"""

import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.transpiler.transpile import transpile

def test_can_duplicate_single_dataframe():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df)

    mito.duplicate_dataframe(0)

    assert len(mito.dfs) == 2
    assert mito.dfs[0].equals(mito.dfs[1])


def test_can_duplicate_single_dataframe_and_add_column():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df)

    mito.duplicate_dataframe(0)
    mito.add_column(1, 'B')

    assert len(mito.dfs) == 2
    assert mito.dfs[1].equals(pd.DataFrame({'A': [123], 'B': [0]}))


def test_can_double_duplicate():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df)

    mito.duplicate_dataframe(0)
    mito.duplicate_dataframe(0)

    assert len(mito.dfs) == 3
    assert mito.dfs[0].equals(mito.dfs[1])
    assert mito.dfs[0].equals(mito.dfs[2])

def test_can_duplicate_with_renamed_column_then_delete():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df)
    mito.add_column(0, 'B')
    mito.rename_column(0, 'B', 'C')
    mito.duplicate_dataframe(0)
    mito.delete_columns(1, ['C'])

    assert len(mito.dfs) == 2
    assert mito.dfs[1].equals(pd.DataFrame({'A': [123]}))
