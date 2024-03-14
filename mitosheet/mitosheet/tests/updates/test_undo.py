#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for undo edit events.
"""
import pandas as pd

from mitosheet.types import FC_NUMBER_EXACTLY
from mitosheet.tests.test_utils import create_mito_wrapper_with_data, create_mito_wrapper


def test_undo_deletes_df_name():
    df1 = pd.DataFrame(data={'A': [1, 2, 3, 4, 5, 6]})
    df2 = pd.DataFrame(data={'A': [1, 2, 3, 4, 5, 6]})
    mito = create_mito_wrapper(df1, df2)

    # Make a new sheet
    mito.merge_sheets('lookup', 0, 1, [['A', 'A']], ['A'], ['A'])
    mito.undo()

    assert mito.df_names == ['df1', 'df2']


def test_undo_to_skipped_step_refreshes_step():
    mito = create_mito_wrapper_with_data([1, 2, 3])
    mito.filter(0, 'A', 'And', FC_NUMBER_EXACTLY, 2)
    mito.filter(0, 'A', 'And', FC_NUMBER_EXACTLY, 3)
    mito.undo()

    assert len(mito.steps_including_skipped) == 2
    assert mito.dfs[0].equals(
        pd.DataFrame({'A': [2]}, index=[1])
    )


def test_undo_saves_in_last_undone_steps():
    mito = create_mito_wrapper_with_data([1, 2, 3])
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    mito.undo()
    assert len(mito.mito_backend.steps_manager.undone_step_list_store) == 1

    mito.undo()
    assert len(mito.mito_backend.steps_manager.undone_step_list_store) == 2
    # Check reverse order
    assert mito.mito_backend.steps_manager.undone_step_list_store[0][1][0].params['column_header'] == 'C'
    assert mito.mito_backend.steps_manager.undone_step_list_store[1][1][0].params['column_header'] == 'B'

    mito.add_column(0, 'B')
    assert len(mito.mito_backend.steps_manager.undone_step_list_store) == 0
