#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for a column rename.
"""

import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_dfs, make_multi_index_header_df
from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.column_headers import get_column_header_id

def test_rename_works():
    mito = create_mito_wrapper([1])
    mito.rename_column(0, 'A', 'B')

    assert mito.dfs[0].equals(pd.DataFrame({'B': [1]}))

def test_rename_to_empty_is_no_op():
    mito = create_mito_wrapper([1])
    mito.rename_column(0, 'A', '')

    assert mito.dfs[0].equals(pd.DataFrame({'A': [1]}))
    assert len(mito.transpiled_code) == 0

def test_rename_update_formulas():
    mito = create_mito_wrapper([1])
    mito.set_formula('=A + 1', 0, 'B', add_column=True)
    mito.rename_column(0, 'A', 'C')

    assert mito.curr_step.column_spreadsheet_code[0]['B'] == '=C + 1'

def test_rename_updates_creation_step():
    mito = create_mito_wrapper([1])
    mito.set_formula('=A', 0, 'B', add_column=True)
    mito.set_formula('=B', 0, 'C', add_column=True)
    mito.rename_column(0, 'B', 'D')

    assert mito.get_python_formula(0, 'D') == 'df[\'D\'] = df[\'A\']'


def test_cannot_update_to_existing_column():
    mito = create_mito_wrapper([1])
    mito.set_formula('=A + 1', 0, 'B', add_column=True)
    mito.rename_column(0, 'A', 'B')

    assert mito.curr_step_idx == 2


def test_rename_multi_sheet():
    mito = create_mito_wrapper([1], sheet_two_A_data=[1])
    mito.set_formula('=A + 1', 0, 'B', add_column=True)
    mito.set_formula('=A + 2', 1, 'B', add_column=True)
    mito.rename_column(0, 'A', 'C')
    mito.rename_column(1, 'A', 'C')

    assert mito.get_formula(0, 'B') == '=C + 1'
    assert mito.get_formula(1, 'B') == '=C + 2'


def test_rename_then_edit_renamed():
    mito = create_mito_wrapper([1])
    mito.set_formula('=A', 0, 'B', add_column=True)
    mito.set_formula('=B', 0, 'C', add_column=True)
    mito.rename_column(0, 'B', 'RENAME')

    # Make sure the formula updated
    assert mito.get_formula(0, 'C') == '=RENAME'

    mito.set_formula('=100', 0, 'RENAME')
    assert mito.get_value(0, 'C', 1) == 100

def test_rename_then_edit_dependent():
    mito = create_mito_wrapper([1])
    mito.set_formula('=A', 0, 'B', add_column=True)
    mito.set_formula('=B', 0, 'C', add_column=True)
    mito.rename_column(0, 'B', 'RENAME')

    # Make sure the formula updated
    curr_step = mito.curr_step
    assert curr_step.column_spreadsheet_code[0][get_column_header_id('C')] == '=RENAME'

    mito.set_formula('=RENAME + 10', 0, 'C')
    assert mito.get_value(0, 'C', 1) == 11


def test_rename_then_merge():
    mito = create_mito_wrapper([1], sheet_two_A_data=[1])
    mito.rename_column(0, 'A', 'KEY')
    mito.rename_column(1, 'A', 'KEY')
    mito.merge_sheets('lookup', 0, 'KEY', ['KEY'], 1, 'KEY', ['KEY'])

    assert len(mito.dfs) == 3
    assert mito.dfs[0].equals(pd.DataFrame(data={'KEY': [1]}))
    assert mito.dfs[1].equals(pd.DataFrame(data={'KEY': [1]}))
    assert mito.dfs[2].equals(pd.DataFrame(data={'KEY': [1]}))