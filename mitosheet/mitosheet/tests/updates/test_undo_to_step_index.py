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


def test_undo_to_step_index():
    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    mito.undo_to_step_index(1)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0]})
    )

def test_undo_to_step_index_then_undo():
    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    mito.undo_to_step_index(1)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0]})
    )

    mito.undo()

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0], 'C': [0]})
    )

def test_undo_to_step_index_twice():

    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    mito.undo_to_step_index(1)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0]})
    )

    mito.undo_to_step_index(0)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1]})
    )

def test_undo_steps_then_edit():
    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    mito.undo_to_step_index(1)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0]})
    )

    mito.add_column(0, 'C')
    mito.rename_column(0, 'A', 'A_new')
    
    assert mito.dfs[0].equals(
        pd.DataFrame({'A_new': [1], 'B': [0], 'C': [0]})
    )


def test_undo_steps_including_new_sheet():
    mito = create_mito_wrapper_with_data([1])

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    TEST_FILE_PATH = 'test_file.csv'
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATH, index=False)

    mito.simple_import([TEST_FILE_PATH])
    
    mito.undo_to_step_index(1)

    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [1], 'B': [0]})
    )

    assert len(mito.dfs) == 1
    assert len(mito.df_names) == 1
    assert len(mito.df_formats) == 1

