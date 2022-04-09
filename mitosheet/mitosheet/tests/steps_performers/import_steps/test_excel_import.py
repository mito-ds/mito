#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import os
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.tests.decorators import pandas_post_1_only, python_post_3_6_only

TEST_FILE = 'file.xlsx'

@pandas_post_1_only
@python_post_3_6_only
def test_can_import_a_single_excel():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_excel(TEST_FILE, index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.excel_import(TEST_FILE, ['Sheet1'], True, 0)

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert mito.curr_step.step_type == 'excel_import'
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(df)
    assert mito.df_names == ['Sheet1']

    # Remove the test file
    os.remove(TEST_FILE)

@pandas_post_1_only
@python_post_3_6_only
def test_can_import_with_no_headers_and_skiprows():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_excel(TEST_FILE, index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.excel_import(TEST_FILE, ['Sheet1'], False, 2)

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert mito.curr_step.step_type == 'excel_import'
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(pd.DataFrame({
        0: [2, 3], 1: [3, 4]
    }))
    assert mito.df_names == ['Sheet1']

    # Remove the test file
    os.remove(TEST_FILE)

@pandas_post_1_only
@python_post_3_6_only
def test_can_import_multiple_sheets():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    with pd.ExcelWriter(TEST_FILE) as writer:  
        df.to_excel(writer, sheet_name='Sheet1', index=False)
        df.to_excel(writer, sheet_name='Sheet2', index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.excel_import(TEST_FILE, ['Sheet1', 'Sheet2'], True, 0)

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert mito.curr_step.step_type == 'excel_import'
    assert len(mito.dfs) == 2
    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(df)
    assert mito.df_names == ['Sheet1', 'Sheet2']
    # Remove the test file
    os.remove(TEST_FILE)

@pandas_post_1_only
@python_post_3_6_only
def test_can_import_multiple_sheets_then_delete_no_optimize():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    with pd.ExcelWriter(TEST_FILE) as writer:  
        df.to_excel(writer, sheet_name='Sheet1', index=False)
        df.to_excel(writer, sheet_name='Sheet2', index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.excel_import(TEST_FILE, ['Sheet1', 'Sheet2'], True, 0)
    mito.delete_dataframe(0)

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(df)
    assert mito.df_names == ['Sheet2']
    assert len(mito.transpiled_code) != 0
    # Remove the test file
    os.remove(TEST_FILE)

@pandas_post_1_only
@python_post_3_6_only
def test_can_import_multiple_sheets_then_delete_last_no_optimize():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    with pd.ExcelWriter(TEST_FILE) as writer:  
        df.to_excel(writer, sheet_name='Sheet1', index=False)
        df.to_excel(writer, sheet_name='Sheet2', index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.excel_import(TEST_FILE, ['Sheet1', 'Sheet2'], True, 0)
    mito.delete_dataframe(1)

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(df)
    assert mito.df_names == ['Sheet1']
    assert len(mito.transpiled_code) != 0
    # Remove the test file
    os.remove(TEST_FILE)

@pandas_post_1_only
@python_post_3_6_only
def test_can_import_multiple_sheets_then_multiple_deletes():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    with pd.ExcelWriter(TEST_FILE) as writer:  
        df.to_excel(writer, sheet_name='Sheet1', index=False)
        df.to_excel(writer, sheet_name='Sheet2', index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.excel_import(TEST_FILE, ['Sheet1', 'Sheet2'], True, 0)
    mito.delete_dataframe(0)
    mito.delete_dataframe(0)

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert len(mito.dfs) == 0
    assert mito.transpiled_code == []
    # Remove the test file
    os.remove(TEST_FILE)

@pandas_post_1_only
@python_post_3_6_only
def test_can_import_multiple_sheets_then_multiple_deletes_later_in_analysis():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    with pd.ExcelWriter(TEST_FILE) as writer:  
        df.to_excel(writer, sheet_name='Sheet1', index=False)
        df.to_excel(writer, sheet_name='Sheet2', index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs(df)
    # And then import just a test file
    mito.excel_import(TEST_FILE, ['Sheet1', 'Sheet2'], True, 0)
    mito.delete_dataframe(2)
    mito.delete_dataframe(1)

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert len(mito.dfs) == 1
    assert mito.transpiled_code == []
    # Remove the test file
    os.remove(TEST_FILE)