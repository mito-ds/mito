#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import os
import sys
import pandas as pd
import pytest
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import DEFAULT_DECIMAL

from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.tests.decorators import pandas_post_1_only, python_post_3_6_only


def test_clear_undoes_mulitple_steps_on_passed_dataframes():
    df1 = pd.DataFrame(data={'A': [1, 2, 3, 4, 5, 6]})
    mito = create_mito_wrapper_dfs(df1)

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.clear()

    assert len(mito.steps_including_skipped) == 1
    assert mito.dfs[0].equals(df1)


def test_clear_can_be_redone_with_single_redo():
    df1 = pd.DataFrame(data={'A': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df1)

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.clear()
    mito.redo()

    assert len(mito.steps_including_skipped) == 3
    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [1, 2, 3],
        'B': [0, 0, 0],
        'C': [0, 0, 0],
    }))



def test_clear_then_undo_actually_redoes():
    df1 = pd.DataFrame(data={'A': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df1)

    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.clear()
    mito.undo()

    assert len(mito.steps_including_skipped) == 3
    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [1, 2, 3],
        'B': [0, 0, 0],
        'C': [0, 0, 0],
    }))

def test_clear_keeps_simple_imports_then_resets():
    df0 = pd.DataFrame(data={'A': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df0)
    mito.add_column(0, 'B')

    df1 = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df1.to_csv('test.csv', index=False)

    mito.simple_import(['test.csv'])
    mito.add_column(1, 'C')
    mito.add_column(1, 'D')

    assert mito.curr_step.step_type == 'add_column'

    mito.clear()
    # Check only simple import remains, and everything else is filtered out 
    # and that no transforms have been applied
    assert mito.curr_step.step_type == 'simple_import'
    assert len(mito.steps_including_skipped) == 2
    assert mito.dfs[0].equals(df0)
    assert mito.dfs[1].equals(df1)


    mito.undo()
    assert mito.mito_widget.steps_manager.curr_step.step_type == 'add_column'
    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [1, 2, 3],
        'B': [0, 0, 0],
    }))
    assert mito.dfs[1].equals(pd.DataFrame({
        'A': [1, 2, 3],
        'B': [2, 3, 4],
        'C': [0, 0, 0],
        'D': [0, 0, 0],
    }))


    # Remove the test file
    os.remove('test.csv')

@pandas_post_1_only
@python_post_3_6_only
def test_clear_resets_excel_imports():
    df0 = pd.DataFrame(data={'A': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df0)
    mito.add_column(0, 'B')

    df1 = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df1.to_excel('test.xlsx', index=False)

    mito.excel_import('test.xlsx', sheet_names=['Sheet1'], has_headers=True, skiprows=0, decimal=DEFAULT_DECIMAL)
    mito.add_column(1, 'C')
    mito.add_column(1, 'D')

    assert mito.curr_step.step_type == 'add_column'

    mito.clear()
    # Check only simple import remains, and everything else is filtered out 
    # and that no transforms have been applied
    assert mito.curr_step.step_type == 'excel_import'
    assert len(mito.steps_including_skipped) == 2
    assert mito.dfs[0].equals(df0)
    assert mito.dfs[1].equals(df1)


    mito.undo()
    assert mito.curr_step.step_type == 'add_column'
    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [1, 2, 3],
        'B': [0, 0, 0],
    }))
    assert mito.dfs[1].equals(pd.DataFrame({
        'A': [1, 2, 3],
        'B': [2, 3, 4],
        'C': [0, 0, 0],
        'D': [0, 0, 0],
    }))


    # Remove the test file
    os.remove('test.xlsx')
