#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for edit events.
"""
import numpy as np
import pandas as pd

from mitosheet.step_performers.filter import FC_STRING_CONTAINS
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.tests.test_utils import create_mito_wrapper_dfs, make_multi_index_header_df
from mitosheet.step_performers.pivot import NEWLINE_TAB, FLATTEN_CODE

def get_expected_pivot_table_code(old_df_name, new_df_name, pivot_rows, pivot_columns, values, pivot_table_args, flatten_column_headers=False):
    """
    NOTE: This function is written seperately
    """

    if flatten_column_headers:
        return [
            f'unused_columns = {old_df_name}.columns.difference(set({pivot_rows}).union(set({pivot_columns})).union(set({set(values.keys())})))',
            f'tmp_df = {old_df_name}.drop(unused_columns, axis=1)',
            f'pivot_table = tmp_df.pivot_table({NEWLINE_TAB}{pivot_table_args}\n)',
            FLATTEN_CODE,
            f'{new_df_name} = pivot_table.reset_index()'
        ]
    else:
        return [
            f'unused_columns = {old_df_name}.columns.difference(set({pivot_rows}).union(set({pivot_columns})).union(set({set(values.keys())})))',
            f'tmp_df = {old_df_name}.drop(unused_columns, axis=1)',
            f'pivot_table = tmp_df.pivot_table({NEWLINE_TAB}{pivot_table_args}\n)',
            f'{new_df_name} = pivot_table.reset_index()'
        ]


def test_simple_pivot():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['sum']})
    mito.set_formula('=LEN(Name)', 1, ('B', ''), add_column=True)

    assert mito.dfs[1].equals(
        make_multi_index_header_df({0: ['Nate'], 1: [9], 2: [4]}, ['Name', ('Height', 'sum'), 'B'])
    )

def test_simple_pivot_does_not_let_spaces_stay_in_columns():
    df1 = pd.DataFrame(data={'Name': ['Nate Rush'], 'Height': [4]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(0, [], ['Name'], {'Height': ['sum']})

    assert mito.dfs[1].equals(
        pd.DataFrame(data={'level_0': ['Height'], 'level_1': ['sum'], 'Nate Rush': [4]})
    )

def test_pivot_nan_works_with_agg_functions():
    df1 = pd.DataFrame(data={'type': ['person', 'person', 'dog', None], 'B': [10, None, 5, 4]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(0, ['type'], [], {'B': ['sum', 'mean', 'min', 'max']})

    assert mito.dfs[1].equals(
        make_multi_index_header_df(
            {'type': ['dog', 'person'], 'B max': [5.0, 10.0], 'B mean': [5.0, 10.0], 'B min': [5.0, 10.0], 'B sum': [5.0, 10.0]},
            ['type', ('B', 'max'), ('B', 'mean'), ('B', 'min'), ('B', 'sum')]
        )
    )


def test_pivot_transpiles_pivot_by_mulitple_columns():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': ['Rush', 'Jack'], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(
        0, [], ['First_Name', 'Last_Name'], {'Height': ['sum']}
    )   

    assert mito.dfs[1].equals(
        make_multi_index_header_df(
            {
                'level_0': ['Height'],
                'level_1': ['sum'],
                'Nate Jack': [5],
                'Nate Rush': [4]
            },
            ['level_0', 'level_1', ('Nate', 'Jack'), ('Nate', 'Rush')]
        )
    )
def test_pivot_transpiles_pivot_mulitple_columns_and_rows():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': ['Rush', 'Jack'], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(
        0, ['Height'], ['First_Name', 'Last_Name'], {'Height': ['sum']}
    )   

    assert mito.dfs[1].equals(
        make_multi_index_header_df(
            {
                'Height': [4, 5],
                'Height sum Nate Jack': [np.NaN, 5],
                'Height sum Nate Rush': [4, np.NaN]
            },
            ['Height', ('Height', 'sum', 'Nate', 'Jack'), ('Height', 'sum', 'Nate', 'Rush')]
        )
    )


def test_pivot_transpiles_pivot_mulitple_columns_non_strings():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': [0, 1], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(
        0, [], ['First_Name', 'Last_Name'], {'Height': ['sum']}
    )   

    assert mito.dfs[1].equals(
        make_multi_index_header_df(
            {
                'level_0': ['Height'],
                'level_1': ['sum'],
                'Nate 0': [4],
                'Nate 1': [5]
            },
            ['level_0', 'level_1', ('Nate', 0), ('Nate', 1)]
        )
    )

def test_pivot_transpiles_with_no_keys_or_values():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': [0, 1], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(
        0, [], [], {}
    )   

    assert mito.dfs[1].equals(
        pd.DataFrame(data={})
    )

def test_pivot_transpiles_with_values_but_no_keys():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': [0, 1], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(
        0, [], [], {'Height': 'sum'}
    )   

    assert mito.dfs[1].equals(
        pd.DataFrame(data={})
    )


def test_pivot_transpiles_with_keys_but_no_values():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': [0, 1], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(
        0, ['First_Name'], [], {}
    )   

    assert mito.dfs[1].equals(
        pd.DataFrame(data={})
    )



def test_pivot_count_unique():
    df1 = pd.DataFrame(data={'First_Name': ['Nate', 'Nate'], 'Last_Name': [0, 1], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(
        0, ['First_Name'], ['Last_Name'], {'Height': ['count unique']}
    )   
    assert mito.dfs[1].equals(
        make_multi_index_header_df(
            {'First_Name': ['Nate'], 'Height nunique 0': [1], 'Height nunique 1': [1]},
            ['First_Name', ('Height', 'nunique', 0), ('Height', 'nunique', 1)]
        )
    )

def test_pivot_rows_and_values_overlap():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate', 'Aaron', 'Jake', 'Jake'], 'Height': [4, 5, 6, 7, 8]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Name': ['count']})

    assert len(mito.steps) == 2
    assert mito.dfs[1].equals(
        make_multi_index_header_df(
            {'Name': ['Aaron', 'Jake', 'Nate'], 'Name count': [1, 2, 2]},
            ['Name', ('Name', 'count')]
        )
    )


def test_pivot_rows_and_values_and_columns_overlap():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate', 'Aaron', 'Jake', 'Jake'], 'Height': [4, 5, 6, 7, 8]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(0, ['Name'], ['Name'], {'Name': ['count']})

    assert len(mito.steps) == 2
    assert mito.dfs[1].equals(
        make_multi_index_header_df(
            {
                'Name': ['Aaron', 'Jake', 'Nate'], 
                'Name count Aaron': [1.0, None, None],
                'Name count Jake': [None, 2.0, None],
                'Name count Nate': [None, None, 2.0],
            },
            ['Name', ('Name', 'count', 'Aaron'), ('Name', 'count', 'Jake'), ('Name', 'count', 'Nate')]
        )
    )


def test_pivot_by_mulitple_functions():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['min', 'max']})

    assert len(mito.steps) == 2
    assert mito.dfs[1].equals(
        make_multi_index_header_df(
            {'Name': ['Nate'], 'Height max': [5], 'Height min': [4]},
            ['Name', ('Height', 'max'), ('Height', 'min')]
        )
    )


def test_pivot_with_optional_parameter_sheet_index():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['min']})
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['max']}, destination_sheet_index=1)

    assert mito.dfs[1].equals(
        make_multi_index_header_df(
            {'Name': ['Nate'], 'Height max': [5]},
            ['Name', ('Height', 'max')]
        )
    )


def test_all_other_steps_after_pivot():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['min']}, flatten_column_headers=True)

    # Run all the other steps
    mito.set_cell_value(1, 'Name', 0, 'Dork')
    mito.change_column_dtype(1, 'Height min', 'string')
    mito.add_column(1, 'A')
    mito.add_column(1, 'B')
    mito.delete_columns(1, ['B'])
    mito.set_formula('=Name', 1, 'A')

    assert mito.dfs[1].equals(
        pd.DataFrame({'Name': ['Dork'], 'Height min': ['4'], 'A': ['Dork']})
    )

    # Duplicate and merge with the original dataframe
    mito.duplicate_dataframe(1)
    mito.set_cell_value(2, 'Name', 0, 'Nate')
    mito.merge_sheets('left', 0, 'Name', ['Name'], 2, 'Name', ['Name'])
    mito.set_cell_value(3, 'Name', 0, 'Aaron')

    # Filter down in the pivot dataframe, and the merged dataframe
    mito.filter(1, 'Height min', 'And', FC_STRING_CONTAINS, "5")
    mito.filter(3, 'Name', 'And', FC_STRING_CONTAINS, "Aaron")

    assert mito.dfs[1].empty
    assert mito.dfs[3].equals(
        pd.DataFrame({'Name': ['Aaron']})
    )


def test_pivot_flatten_column_headers():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(0, ['Name'], [], {'Height': ['min']}, True)

    assert mito.dfs[1].equals(
        pd.DataFrame({'Name': 'Nate', 'Height min': [4]})
    )