#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for set column formula edit events
"""
from numpy import add
import pandas as pd

from mitosheet.utils import get_new_id
from mitosheet.tests.test_utils import create_mito_wrapper_dfs, create_mito_wrapper
from mitosheet.column_headers import get_column_header_id


def test_edit_cell_formula_on_message_receive():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(mito.dfs[0]['A'])

def test_overwrite_on_double_set():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')
    mito.set_formula('=1', 0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(pd.Series([1]))
    assert mito.curr_step_idx == 3

def test_double_set_does_not_error():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')

    mito.mito_widget.receive_message(mito, {
        'event': 'edit_event',
        'id': get_new_id(),
        'type': 'set_column_formula_edit',
        'step_id': get_new_id(),
        'sheet_index': 0,
        'column_header': 'B',
        'new_formula': '=A'
    })

    assert 'B' in mito.dfs[0]
    assert mito.dfs[0]['B'].equals(mito.dfs[0]['A'])

def test_edit_cell_formula_mulitple_msg_receives():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')
    mito.set_formula('=1', 0, 'B')

    assert 'B' in mito.dfs[0]
    assert mito.curr_step.column_spreadsheet_code[0]['B'] == '=1'


def test_edit_to_same_formula_no_error():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=A', 0, 'B')

    # should not throw error
    mito.mito_widget.steps_manager.handle_edit_event({
        'event': 'edit_event',
        'type': 'set_column_formula_edit',
        'step_id': get_new_id(),
        'params': {
            'sheet_index': 0,
            'column_id': get_column_header_id('B'),
            'new_formula': '=A'
        }
    })

    assert 'B' in mito.dfs[0]
    assert mito.curr_step.column_spreadsheet_code[0]['B'] == '=A'


def test_no_circularity_on_simple_circular_message_receive():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=B', 0, 'B')

    assert mito.curr_step.column_spreadsheet_code[0]['B'] == '=0'

def test_formulas_fill_missing_parens():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(A', 0, 'B')

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'A': [123],
            'B': [123]
        })
    )

def test_formulas_fill_missing_two_parens():
    mito = create_mito_wrapper([123])
    mito.add_column(0, 'B')
    mito.set_formula('=SUM(SUM(A', 0, 'B')

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'A': [123],
            'B': [123]
        })
    )


def test_multi_sheet_edits_edit_correct_dfs():
    df1 = pd.DataFrame(data={'A': [1]})
    df2 = pd.DataFrame(data={'A': [2]})
    mito = create_mito_wrapper_dfs(df1, df2)

    mito.add_column(0, 'B')
    mito.add_column(1, 'B')
    mito.set_formula('=A + 1', 0, 'B')
    mito.set_formula('=A + 100', 1, 'B')

    assert 'B' in mito.dfs[0]
    assert 'B' in mito.dfs[1]
    assert mito.curr_step.column_spreadsheet_code[0]['B'] == '=A + 1'
    assert mito.curr_step.column_spreadsheet_code[1]['B'] == '=A + 100'


def test_only_writes_downstream_code():
    df = pd.DataFrame(data={'A': [1]})
    mito = create_mito_wrapper_dfs(df)
    mito.set_formula('=A', 0, 'B', add_column=True)
    mito.set_formula('=B', 0, 'C', add_column=True)
    mito.set_formula('=A', 0, 'D', add_column=True)
    mito.set_formula('=100', 0, 'B', add_column=True)

    assert mito.transpiled_code == [
        "df1.insert(1, 'B', df1['A'])", 
        "df1.insert(2, 'C', df1['B'])", 
        "df1.insert(3, 'D', df1['A'])", 
        "df1['B'] = 100", 
        "df1['C'] = df1['B']", 
    ]

def test_formula_with_letters_df_in_column_header_works():
    df = pd.DataFrame(data={'df': [1]})
    mito = create_mito_wrapper_dfs(df)
    mito.set_formula('=df', 0, 'A', add_column=True)

    assert mito.dfs[0].equals(
        pd.DataFrame({
            'df': [1],
            'A': [1]
        })
    )