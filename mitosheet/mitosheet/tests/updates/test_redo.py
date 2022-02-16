#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper


def test_redo_redoes_action():
    mito = create_mito_wrapper([1, 2, 3])
    mito.add_column(0, 'B')
    mito.undo()
    mito.redo()

    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [1, 2, 3],
        'B': [0, 0, 0]
    }))

    assert len(mito.mito_widget.steps_manager.undone_step_list_store) == 0

def test_redo_redoes_action_twice():
    mito = create_mito_wrapper([1, 2, 3])
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.undo()
    mito.undo()
    mito.redo()
    mito.redo()

    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [1, 2, 3],
        'B': [0, 0, 0],
        'C': [0, 0, 0]
    }))

    assert len(mito.mito_widget.steps_manager.undone_step_list_store) == 0

def test_undo_redo_undo_undo():
    mito = create_mito_wrapper([1, 2, 3])
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    mito.undo()
    mito.redo()
    mito.undo()
    mito.redo()

    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [1, 2, 3],
        'B': [0, 0, 0],
        'C': [0, 0, 0]
    }))

    assert len(mito.mito_widget.steps_manager.undone_step_list_store) == 0

def test_redo_no_error_when_nothing_to_undo():
    mito = create_mito_wrapper([1, 2, 3])
    mito.redo()

    assert mito.dfs[0].equals(pd.DataFrame({
        'A': [1, 2, 3],
    }))

    assert len(mito.mito_widget.steps_manager.undone_step_list_store) == 0