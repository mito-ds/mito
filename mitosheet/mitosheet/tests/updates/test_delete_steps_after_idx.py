#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for checking out a specific index
"""
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_with_data
from mitosheet.transpiler.transpile import transpile, IN_PREVIOUS_STEP_COMMENT


def test_delete_following_steps():
    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    mito.delete_steps_after_idx(1)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0]})
    )

def test_delete_following_steps_then_undo():
    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    mito.delete_steps_after_idx(1)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0]})
    )

    mito.undo()

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0], 'C': [0]})
    )

def test_delete_following_steps_twice():

    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    mito.delete_steps_after_idx(1)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0]})
    )

    mito.delete_steps_after_idx(0)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1]})
    )

def test_delete_steps_then_edit():
    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    mito.delete_steps_after_idx(1)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0]})
    )

    mito.add_column(0, 'C')
    mito.rename_column(0, 'A', 'A_new')
    
    assert mito.dfs[0].equals(
        pd.DataFrame({'A_new': [1], 'B': [0], 'C': [0]})
    )
