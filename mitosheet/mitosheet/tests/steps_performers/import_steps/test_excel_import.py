import os
import sys
import pytest
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_dfs

TEST_FILE = 'file.xlsx'

@pytest.mark.skipif(sys.version_info.minor <= 6, reason="requires 3.7 or greater")
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

@pytest.mark.skipif(sys.version_info.minor <= 6, reason="requires 3.7 or greater")
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

@pytest.mark.skipif(sys.version_info.minor <= 6, reason="requires 3.7 or greater")
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