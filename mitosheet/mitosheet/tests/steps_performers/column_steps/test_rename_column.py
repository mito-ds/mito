#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for a column rename.
"""

import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper, create_mito_wrapper_dfs
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


def test_double_rename_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [123]}))
    mito.rename_column(0, 'A', 'B')
    mito.rename_column(0, 'B', 'C')

    assert mito.transpiled_code == [
        "df1.rename(columns={'A': 'C'}, inplace=True)"
    ]

def test_multiple_rename_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [123]}))
    mito.rename_column(0, 'A', 'B')
    mito.rename_column(0, 'B', 'C')
    mito.rename_column(0, 'C', 'D')
    mito.rename_column(0, 'D', 'E')

    assert mito.transpiled_code == [
        "df1.rename(columns={'A': 'E'}, inplace=True)"
    ]

def test_multiple_rename_different_columns_optimizes():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [123], 'AA': [1234]}))
    mito.rename_column(0, 'A', 'B')
    mito.rename_column(0, 'AA', 'BB')
    mito.rename_column(0, 'B', 'C')
    mito.rename_column(0, 'BB', 'CC')
    mito.rename_column(0, 'C', 'D')
    mito.rename_column(0, 'CC', 'DD')
    mito.rename_column(0, 'D', 'E')
    mito.rename_column(0, 'DD', 'EE')

    assert mito.transpiled_code == [
        "df1.rename(columns={'A': 'E', 'AA': 'EE'}, inplace=True)"
    ]

def test_multiple_rename_more_than_three_columns():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [123], 'AA': [1234], 'AAA': [12345], 'AAAA': [123456]}))
    mito.rename_column(0, 'A', 'B')
    mito.rename_column(0, 'AA', 'BB')
    mito.rename_column(0, 'AAA', 'BBB')
    mito.rename_column(0, 'AAAA', 'BBBB')
    mito.rename_column(0, 'B', 'C')
    mito.rename_column(0, 'BB', 'CC')
    mito.rename_column(0, 'BBB', 'CCC')
    mito.rename_column(0, 'BBBB', 'CCCC')
    mito.rename_column(0, 'C', 'D')
    mito.rename_column(0, 'CC', 'DD')
    mito.rename_column(0, 'CCC', 'DDD')
    mito.rename_column(0, 'CCCC', 'DDDD')
    mito.rename_column(0, 'D', 'E')
    mito.rename_column(0, 'DD', 'EE')
    mito.rename_column(0, 'DDD', 'EEE')
    mito.rename_column(0, 'DDDD', 'EEEE')

    assert mito.transpiled_code == [
        "df1.rename(columns={\n\
    'A': 'E',\n\
    'AA': 'EE',\n\
    'AAA': 'EEE',\n\
    'AAAA': 'EEEE'\n\
}, inplace=True)"
    ]

def test_multiple_rename_optimizes_then_delete():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [123]}))
    mito.rename_column(0, 'A', 'B')
    mito.rename_column(0, 'B', 'C')
    mito.rename_column(0, 'C', 'D')
    mito.rename_column(0, 'D', 'E')
    mito.delete_columns(0, ['E'])

    assert mito.transpiled_code == [
        "df1.drop(['A'], axis=1, inplace=True)"
    ]

def test_multiple_rename_optimizes_then_delete_multiple():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [123], 'F': [123]}))
    mito.rename_column(0, 'A', 'B')
    mito.rename_column(0, 'B', 'C')
    mito.rename_column(0, 'C', 'D')
    mito.rename_column(0, 'D', 'E')
    mito.delete_columns(0, ['E', 'F'])

    assert mito.dfs[0].empty
    assert mito.transpiled_code == [
        "df1.drop(['A', 'F'], axis=1, inplace=True)"
    ]

def test_multiple_renames_optimizes_then_delete_multiple():
    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [123], 'F': [123]}))
    mito.rename_column(0, 'A', 'B')
    mito.rename_column(0, 'B', 'C')
    mito.rename_column(0, 'C', 'D')
    mito.rename_column(0, 'D', 'E')
    mito.rename_column(0, 'F', 'FF')
    mito.delete_columns(0, ['E', 'FF'])

    assert mito.dfs[0].empty
    assert mito.transpiled_code == [
        "df1.drop(['A', 'F'], axis=1, inplace=True)"
    ]