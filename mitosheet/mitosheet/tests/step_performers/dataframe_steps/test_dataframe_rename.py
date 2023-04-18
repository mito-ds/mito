#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for dataframe_rename
"""

import os
import pytest
import pandas as pd
from mitosheet.api.get_validate_snowflake_credentials import get_validate_snowflake_credentials
from mitosheet.tests.step_performers.import_steps.test_snowflake_import import TEST_SNOWFLAKE_CREDENTIALS, TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE

from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.tests.decorators import pandas_post_1_only, python_post_3_6_only, requires_snowflake_dependencies_and_credentials, pandas_post_1_2_only


def test_can_rename_single_dataframe():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df)

    mito.rename_dataframe(0, 'df100')

    assert mito.df_names == ['df100']

def test_rename_dataframe_twice_optimizes():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df)

    mito.rename_dataframe(0, 'df100')
    mito.rename_dataframe(0, 'df101')

    assert mito.df_names == ['df101']
    assert len(mito.optimized_code_chunks) == 1

def test_rename_two_different_dataframes_no_optimizes():
    df = pd.DataFrame({'A': [123]})
    df1 = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df, df1)

    mito.rename_dataframe(0, 'df100')
    mito.rename_dataframe(1, 'df101')

    assert mito.df_names == ['df100', 'df101']
    assert len(mito.optimized_code_chunks) == 2

def test_can_rename_multiple_dataframes():
    df1 = pd.DataFrame({'A': [123]})
    df2 = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df1, df2)

    mito.rename_dataframe(0, 'df100')
    mito.rename_dataframe(1, 'df101')

    assert mito.df_names == ['df100', 'df101']


def test_can_rename_overlapping_name():
    df1 = pd.DataFrame({'A': [123]})
    df2 = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df1, df2)

    mito.rename_dataframe(1, 'df1')

    assert mito.df_names == ['df1', 'df1_1']


def test_can_rename_no_change():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df)

    mito.rename_dataframe(0, 'df1')

    assert len(mito.transpiled_code) == 0


INVALID_NAME_TESTS = [
    ('df 100', 'df_100'),
    ('New Sheet', 'New_Sheet'),
    ('Marketing-Data', 'Marketing_Data'),
    ('Marketing-Data!', 'Marketing_Data'),
    ('This!Is!New', 'This_Is_New'),
]
@pytest.mark.parametrize("invalid_name, correct_name", INVALID_NAME_TESTS)
def test_rename_handles_invalid_names(invalid_name, correct_name): 
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df)

    mito.rename_dataframe(0, invalid_name)

    assert mito.transpiled_code == [
        f'{correct_name} = df1'
    ]


def test_rename_optimized_after_dataframe_delete():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df)

    mito.rename_dataframe(0, 'abc123')
    mito.delete_dataframe(0)

    assert len(mito.transpiled_code) > 0 

def test_rename_not_optimized_after_different_dataframe_delete():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df)

    mito.duplicate_dataframe(0)
    mito.rename_dataframe(0, 'abc123')
    mito.delete_dataframe(1)

    assert len(mito.optimized_code_chunks) >= 3

def test_pivot_then_rename_same_df_optimizes():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['A'], [], {'A': ['count']})
    mito.rename_dataframe(1, 'abc')

    assert mito.df_names[1] == 'abc'
    assert mito.dfs[1].equals(pd.DataFrame({'A': [123], 'A count': [1]}))
    assert len(mito.optimized_code_chunks) == 1
    
def test_pivot_then_edit_then_rename_same_df_optimizes():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df)
    mito.pivot_sheet(0, ['A'], [], {'A': ['count']})
    mito.pivot_sheet(0, ['A'], [], {'A': ['sum']}, destination_sheet_index=1)
    mito.rename_dataframe(1, 'abc')

    assert mito.df_names[1] == 'abc'
    assert mito.dfs[1].equals(pd.DataFrame({'A': [123], 'A sum': [123]}))
    assert len(mito.optimized_code_chunks) == 1

def test_pivot_then_rename_different_df_not_optimizes():
    df = pd.DataFrame({'A': [123]})
    df1 = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df, df1)
    mito.pivot_sheet(0, ['A'], [], {'A': ['count']})
    mito.rename_dataframe(1, 'abc')

    assert mito.df_names[1] == 'abc'
    assert mito.dfs[1].equals(df1)
    assert mito.dfs[2].equals(pd.DataFrame({'A': [123], 'A count': [1]}))
    assert len(mito.optimized_code_chunks) == 2

def test_merge_then_rename_same_df_optimizes():
    df = pd.DataFrame({'A': [123]})
    df1 = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df, df1)
    mito.merge_sheets('left', 0, 1, [('A', 'A')], ['A'], ['A'])
    mito.rename_dataframe(2, 'abc')

    assert mito.df_names[2] == 'abc'
    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(df1)
    assert mito.dfs[2].equals(pd.DataFrame({'A': [123]}))
    assert len(mito.optimized_code_chunks) == 1

def test_merge_then_rename_diff_df_not_optimizes():
    df = pd.DataFrame({'A': [123]})
    df1 = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df, df1)
    mito.merge_sheets('left', 0, 1, [('A', 'A')], ['A'], ['A'])
    mito.rename_dataframe(1, 'abc')

    assert mito.df_names[1] == 'abc'
    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(df1)
    assert mito.dfs[2].equals(pd.DataFrame({'A': [123]}))
    assert len(mito.optimized_code_chunks) == 2

TEST_CSV_FILE = 'tmp.csv'
TEST_XLSX_FILE = 'tmp.xlsx'

def test_simple_import_then_rename_same_df_optimizes():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_CSV_FILE, index=False)

    mito = create_mito_wrapper()
    mito.simple_import([TEST_CSV_FILE])
    mito.rename_dataframe(0, 'abc')

    assert mito.df_names[0] == 'abc'
    assert mito.dfs[0].equals(df)
    assert len(mito.optimized_code_chunks) == 1

    # Remove the test file
    os.remove(TEST_CSV_FILE)


def test_simple_import_then_rename_diff_df_not_optimizes():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_CSV_FILE, index=False)

    mito = create_mito_wrapper(df)
    mito.simple_import([TEST_CSV_FILE])
    mito.rename_dataframe(0, 'abc')

    assert mito.df_names[0] == 'abc'
    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(df)
    assert len(mito.optimized_code_chunks) == 2

    # Remove the test file
    os.remove(TEST_CSV_FILE)

@pandas_post_1_only
@python_post_3_6_only
def test_excel_import_then_rename_same_df_optimizes():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_excel(TEST_XLSX_FILE, index=False)

    mito = create_mito_wrapper()
    mito.excel_import(TEST_XLSX_FILE, ['Sheet1'], True, 0)
    mito.rename_dataframe(0, 'abc')

    assert mito.df_names[0] == 'abc'
    assert mito.dfs[0].equals(df)
    assert len(mito.optimized_code_chunks) == 1

    # Remove the test file
    os.remove(TEST_XLSX_FILE)


@pandas_post_1_only
@python_post_3_6_only
def test_excel_import_then_rename_diff_df_not_optimizes():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_excel(TEST_XLSX_FILE, index=False)

    mito = create_mito_wrapper(df)
    mito.excel_import(TEST_XLSX_FILE, ['Sheet1'], True, 0)
    mito.rename_dataframe(0, 'abc')

    assert mito.df_names[0] == 'abc'
    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(df)
    assert len(mito.optimized_code_chunks) == 2

    # Remove the test file
    os.remove(TEST_XLSX_FILE)

@pandas_post_1_2_only
@python_post_3_6_only
def test_excel_range_import_then_rename_same_df_optimizes():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    mito = create_mito_wrapper()
    df.to_excel(TEST_XLSX_FILE, sheet_name='Sheet1', index=False)

    mito.excel_range_import(TEST_XLSX_FILE, 'Sheet1', [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B4'}], False)
    mito.rename_dataframe(0, 'abc')

    assert mito.df_names[0] == 'abc'
    assert mito.dfs[0].equals(df)
    assert len(mito.optimized_code_chunks) == 1

    os.remove(TEST_XLSX_FILE)

@pandas_post_1_2_only
@python_post_3_6_only
def test_excel_range_import_then_rename_diff_df_not_optimizes():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    mito = create_mito_wrapper(df)
    df.to_excel(TEST_XLSX_FILE, sheet_name='Sheet1', index=False)

    mito.excel_range_import(TEST_XLSX_FILE, 'Sheet1', [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B4'}], False)
    mito.rename_dataframe(0, 'abc')

    assert mito.df_names[0] == 'abc'
    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(df)
    assert len(mito.optimized_code_chunks) == 2

    os.remove(TEST_XLSX_FILE)

@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_snowflake_import_then_rename_same_df_optimizes():
    mito = create_mito_wrapper()
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    query_params = {'columns': ['COLUMNA', 'COLUMNB'], 'limit': 2}

    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, query_params)
    mito.rename_dataframe(0, 'abc')

    assert mito.df_names[0] == 'abc'
    assert mito.dfs[0].equals(pd.DataFrame({'COLUMNA': ['Aaron', 'Nate'], 'COLUMNB': ["DR", "Rush"]}))
    assert len(mito.optimized_code_chunks) == 1

@requires_snowflake_dependencies_and_credentials
@python_post_3_6_only
def test_snowflake_import_then_rename_diff_df_not_optimizes():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    mito = create_mito_wrapper(df)
    get_validate_snowflake_credentials(TEST_SNOWFLAKE_CREDENTIALS, mito.mito_backend.steps_manager)

    query_params = {'columns': ['COLUMNA', 'COLUMNB'], 'limit': 2}

    mito.snowflake_import(TEST_SNOWFLAKE_TABLE_LOC_AND_WAREHOUSE, query_params)
    mito.rename_dataframe(0, 'abc')

    assert mito.df_names[0] == 'abc'
    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(pd.DataFrame({'COLUMNA': ['Aaron', 'Nate'], 'COLUMNB': ["DR", "Rush"]}))
    assert len(mito.optimized_code_chunks) == 2
