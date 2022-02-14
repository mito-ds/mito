#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for a reordering a column.
"""

import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_dfs

def test_reorder_column_simple():
    df = pd.DataFrame(data={'A': [1], 'B': [2]})
    mito = create_mito_wrapper_dfs(df)
    # Put A in second spot
    mito.reorder_column(0, 'A', 1)


    assert len(mito.steps) == 2
    correct_column_order = ['B', 'A']

    # Make sure the columns are ordered properly 
    assert correct_column_order[0] == mito.dfs[0].columns[0]
    assert correct_column_order[1] == mito.dfs[0].columns[1]


def test_reorder_column_index_too_large():
    df = pd.DataFrame(data={'A': [1], 'B': [2]})
    mito = create_mito_wrapper_dfs(df)

    mito.reorder_column(0, 'A', 5)

    assert len(mito.steps) == 2

    correct_column_order = ['B', 'A']

    # Make sure the columns are ordered properly 
    assert correct_column_order[0] == mito.dfs[0].columns[0]
    assert correct_column_order[1] == mito.dfs[0].columns[1]

def test_reorder_column_index_too_small():
    df = pd.DataFrame(data={'A': [1], 'B': [2]})
    mito = create_mito_wrapper_dfs(df)
    # Put A in second spot
    mito.reorder_column(0, 'B', -1)

    assert len(mito.steps) == 2

    correct_column_order = ['B', 'A']

    # Make sure the columns are ordered properly 
    assert correct_column_order[0] == mito.dfs[0].columns[0]
    assert correct_column_order[1] == mito.dfs[0].columns[1]

def test_reorder_column_twice():
    df = pd.DataFrame(data={'A': [1], 'B': [2]})
    mito = create_mito_wrapper_dfs(df)
    # Put A in second spot
    mito.reorder_column(0, 'A', 1)
    mito.reorder_column(0, 'B', 1)

    assert len(mito.steps) == 3

    correct_column_order = ['A', 'B']

    # Make sure the columns are ordered properly 
    assert correct_column_order[0] == mito.dfs[0].columns[0]
    assert correct_column_order[1] == mito.dfs[0].columns[1]


def test_reorder_column_several_columns():
    df = pd.DataFrame(data={'A': [1], 'B': [2], 'C': [3], 'D': [4]})
    mito = create_mito_wrapper_dfs(df)
    # Put A in second spot
    mito.reorder_column(0, 'D', 1)
    mito.reorder_column(0, 'C', 1)

    assert len(mito.steps) == 3

    correct_column_order = ['A', 'C', 'D', 'B']

    # Make sure the columns are ordered properly 
    assert correct_column_order[0] == mito.dfs[0].columns[0]
    assert correct_column_order[1] == mito.dfs[0].columns[1]
    assert correct_column_order[2] == mito.dfs[0].columns[2]
    assert correct_column_order[3] == mito.dfs[0].columns[3]