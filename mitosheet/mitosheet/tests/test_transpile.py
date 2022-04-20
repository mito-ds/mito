#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from mitosheet.transpiler.transpile_utils import NEWLINE_TAB
import pytest
import pandas as pd

from mitosheet.transpiler.transpile import transpile
from mitosheet.tests.test_utils import create_mito_wrapper, create_mito_wrapper_dfs


def test_transpile_single_column():
    mito = create_mito_wrapper(['abc'])
    mito.set_formula('=A', 0, 'B', add_column=True)

    assert mito.transpiled_code == [
        "df1.insert(1, 'B', df1[\'A\'])", 
    ]


def test_transpile_multiple_columns_no_relationship():
    mito = create_mito_wrapper(['abc'])
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    assert mito.transpiled_code == [
        'df1.insert(1, \'B\', 0)',
        'df1.insert(2, \'C\', 0)',
    ]

def test_transpile_columns_in_each_sheet():
    mito = create_mito_wrapper(['abc'], sheet_two_A_data=['abc'])
    mito.add_column(0, 'B')
    mito.add_column(1, 'B')

    assert mito.transpiled_code == [
        'df1.insert(1, \'B\', 0)',
        'df2.insert(1, \'B\', 0)',
    ]

def test_transpile_multiple_columns_linear():
    mito = create_mito_wrapper(['abc'])
    mito.set_formula('=A', 0, 'B', add_column=True)
    mito.set_formula('=B', 0, 'C', add_column=True)

    assert mito.transpiled_code == [
        'df1.insert(1, \'B\', df1[\'A\'])',
        'df1.insert(2, \'C\', df1[\'B\'])',
    ]

COLUMN_HEADERS = [
    ('ABC'),
    ('ABC_D'),
    ('ABC_DEF'),
    ('ABC_123'),
    ('ABC_HAHA_123'),
    ('ABC_HAHA-123'),
    ('---data---'),
    ('---da____ta---'),
    ('--'),
]
@pytest.mark.parametrize("column_header", COLUMN_HEADERS)
def test_transpile_column_headers_non_alphabet(column_header):
    mito = create_mito_wrapper(['abc'])
    mito.set_formula('=A', 0, column_header, add_column=True)

    assert mito.transpiled_code == [
        f'df1.insert(1, \'{column_header}\', df1[\'A\'])', 
    ]


COLUMN_HEADERS = [
    ('ABC'),
    ('ABC_D'),
    ('ABC_DEF'),
    ('ABC_123'),
    ('ABC_HAHA_123'),
    ('ABC_HAHA-123'),
    ('---data---'),
    ('---da____ta---'),
    ('--'),
]
@pytest.mark.parametrize("column_header", COLUMN_HEADERS)
def test_transpile_column_headers_non_alphabet_multi_sheet(column_header):
    mito = create_mito_wrapper(['abc'], sheet_two_A_data=['abc'])
    mito.set_formula('=A', 0, column_header, add_column=True)
    mito.set_formula('=A', 1, column_header, add_column=True)

    assert mito.transpiled_code == [
        f'df1.insert(1, \'{column_header}\', df1[\'A\'])', 
        f'df2.insert(1, \'{column_header}\', df2[\'A\'])', 
    ]

def test_preserves_order_columns():
    mito = create_mito_wrapper(['abc'])
    # Topological sort will currently display this in C, B order
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    assert mito.transpiled_code == [
        'df1.insert(1, \'B\', 0)',
        'df1.insert(2, \'C\', 0)',
    ]

def test_transpile_delete_columns():
    df1 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    mito = create_mito_wrapper_dfs(df1)
    mito.delete_columns(0, ['C', 'B'])

    assert mito.transpiled_code == [
        'df1.drop([\'C\', \'B\'], axis=1, inplace=True)'
    ]


# TESTING OPTIMIZATION

def test_removes_unedited_formulas_for_unedited_sheets():
    df1 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    df2 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    mito = create_mito_wrapper_dfs(df1, df2)

    mito.set_formula('=C', 0, 'D', add_column=True)
    mito.set_formula('=C', 1, 'D', add_column=True)

    mito.merge_sheets('lookup', 0, 'A', ['A', 'B', 'C', 'D'], 1, 'A', ['A', 'B', 'C', 'D'])

    mito.set_formula('=C + 1', 1, 'D', add_column=True)

    assert mito.transpiled_code == [
        "df1.insert(3, 'D', df1[\'C\'])", 
        "df2.insert(3, 'D', df2[\'C\'])", 
        'temp_df = df2.drop_duplicates(subset=\'A\') # Remove duplicates so lookup merge only returns first match', 
        'df3 = df1.merge(temp_df, left_on=[\'A\'], right_on=[\'A\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])',
        'df2[\'D\'] = df2[\'C\'] + 1',
    ]


def test_mulitple_merges_no_formula_steps():
    df1 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    df2 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    mito = create_mito_wrapper_dfs(df1, df2)
    mito.merge_sheets('lookup', 0, 'A', ['A', 'B', 'C'], 1, 'A', ['A', 'B', 'C'])
    mito.merge_sheets('lookup', 0, 'A', ['A', 'B', 'C'], 1, 'A', ['A', 'B', 'C'])
    mito.merge_sheets('lookup', 0, 'A', ['A', 'B', 'C'], 1, 'A', ['A', 'B', 'C'])


    assert mito.transpiled_code == [
        'temp_df = df2.drop_duplicates(subset=\'A\') # Remove duplicates so lookup merge only returns first match', 
        'df3 = df1.merge(temp_df, left_on=[\'A\'], right_on=[\'A\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])',
        'temp_df = df2.drop_duplicates(subset=\'A\') # Remove duplicates so lookup merge only returns first match', 
        'df4 = df1.merge(temp_df, left_on=[\'A\'], right_on=[\'A\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])',
        'temp_df = df2.drop_duplicates(subset=\'A\') # Remove duplicates so lookup merge only returns first match', 
        'df5 = df1.merge(temp_df, left_on=[\'A\'], right_on=[\'A\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])'
    ]

def test_optimization_with_other_edits():
    df1 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    df2 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    mito = create_mito_wrapper_dfs(df1, df2)
    mito.add_column(0, 'D')
    mito.set_formula('=A', 0, 'D')
    mito.merge_sheets('lookup', 0, 'A', ['A', 'B', 'C', 'D'], 1, 'A', ['A', 'B', 'C'])
    mito.add_column(0, 'AAA')
    mito.delete_columns(0, ['AAA'])

    assert mito.transpiled_code == [
        "df1.insert(3, 'D', df1[\'A\'])", 
        'temp_df = df2.drop_duplicates(subset=\'A\') # Remove duplicates so lookup merge only returns first match', 
        'df3 = df1.merge(temp_df, left_on=[\'A\'], right_on=[\'A\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])',
    ]

flatten_code = f'pivot_table.columns = [{NEWLINE_TAB}\'_\'.join([str(c) for c in col]).strip() if isinstance(col, tuple) else col{NEWLINE_TAB}for col in pivot_table.columns.values\n]'


def test_transpile_does_no_initial():
    df1 = pd.DataFrame(data={'First Name': ['Nate', 'Nate'], 123: ['Rush', 'Jack'], True: ['1', '2']})
    mito = create_mito_wrapper_dfs(df1)

    assert len(mito.transpiled_code) == 0

    
def test_transpile_reorder_column():
    df1 = pd.DataFrame(data={'A': ['aaron'], 'B': ['jon']})
    mito = create_mito_wrapper_dfs(df1)
    mito.reorder_column(0, 'A', 1)

    assert mito.transpiled_code == [
        'df1_columns = [col for col in df1.columns if col != \'A\']',
        'df1_columns.insert(1, \'A\')',
        'df1 = df1[df1_columns]'
    ]

def test_transpile_two_column_reorders():
    df1 = pd.DataFrame(data={'A': ['aaron'], 'B': ['jon']})
    mito = create_mito_wrapper_dfs(df1)
    mito.reorder_column(0, 'A', 1)
    mito.reorder_column(0, 'B', 1)

    assert mito.transpiled_code == [
        'df1_columns = [col for col in df1.columns if col != \'A\']',
        'df1_columns.insert(1, \'A\')',
        'df1 = df1[df1_columns]',
        'df1_columns = [col for col in df1.columns if col != \'B\']',
        'df1_columns.insert(1, \'B\')',
        'df1 = df1[df1_columns]'
    ]

def test_transpile_reorder_column_invalid():
    df1 = pd.DataFrame(data={'A': ['aaron'], 'B': ['jon']})
    mito = create_mito_wrapper_dfs(df1)
    mito.reorder_column(0, 'A', 5)

    assert mito.transpiled_code == [
        'df1_columns = [col for col in df1.columns if col != \'A\']',
        'df1_columns.insert(1, \'A\')',
        'df1 = df1[df1_columns]',
    ]

def test_transpile_merge_then_sort():
    df1 = pd.DataFrame(data={'Name': ["Aaron", "Nate"], 'Number': [123, 1]})
    df2 = pd.DataFrame(data={'Name': ["Aaron", "Nate"], 'Sign': ['Gemini', "Tarus"]})
    mito = create_mito_wrapper_dfs(df1, df2)
    mito.merge_sheets('lookup', 0, 'Name', list(df1.keys()), 1, 'Name', list(df2.keys()))
    mito.sort(2, 'Number', 'ascending')

    assert mito.transpiled_code == [
        'temp_df = df2.drop_duplicates(subset=\'Name\') # Remove duplicates so lookup merge only returns first match',
        'df3 = df1.merge(temp_df, left_on=[\'Name\'], right_on=[\'Name\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])',
        'df3 = df3.sort_values(by=\'Number\', ascending=True, na_position=\'first\')',
    ]