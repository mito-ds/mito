#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for existing import update events.
"""
import pandas as pd
import os
from mitosheet.tests.test_utils import create_mito_wrapper, create_mito_wrapper_dfs
from mitosheet.tests.decorators import pandas_post_1_only, python_post_3_6_only

TEST_EXCEL_FILE = 'excel_file.xlsx'
TEST_CSV_FILE = 'csv_file.csv'
TEST_CSV_FILE_TWO = 'csv_file_two.csv'


@pandas_post_1_only
@python_post_3_6_only
def test_overwrite_multiple_imports():
    # Make dataframes and files for test
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df1 = pd.DataFrame(data={'C': [1, 2, 3], 'D': [2, 3, 4]})
    df2 = pd.DataFrame(data={'E': [1, 2, 3], 'F': [2, 3, 4]})
    df1.to_csv(TEST_CSV_FILE, index=False, sep=',', encoding='utf-8')
    with pd.ExcelWriter(TEST_EXCEL_FILE) as writer:  
        df.to_excel(writer, sheet_name='Sheet1', index=False)
        df.to_excel(writer, sheet_name='Sheet2', index=False)
        df.to_excel(writer, sheet_name='Sheet3', index=False)

    
    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import three sheets from the excel file
    mito.excel_import(TEST_EXCEL_FILE, ['Sheet1', 'Sheet2', 'Sheet3'], True, 0)

    step_id = mito.curr_step.step_id

    # Update the imports 
    updated_import_obj = [
        {
            'step_id': step_id,
            'type': 'csv',
            'import_params': {
                'file_names': [TEST_CSV_FILE],
                'delimeters': [','],
                'encodings': ['utf-8'],
                'error_bad_lines': [False],
            }
        },
        {
            'step_id': step_id,
            'type': 'excel',
            'import_params': {
                'file_name': TEST_EXCEL_FILE,
                'sheet_names': ['Sheet3'],
                'has_headers': True,
                'skiprows': 0,
            }
        },  
        {
            'step_id': step_id,
            'type': 'df',
            'import_params': {
                'df_names': ['df2']
            }
        }
    ]

    mito.update_existing_imports(updated_import_obj)

    # Make sure the updates occured correctly 
    new_csv_import_step = mito.steps_including_skipped[1]
    assert new_csv_import_step.step_type == 'simple_import'

    new_excel_import_step = mito.steps_including_skipped[2]
    assert new_excel_import_step.step_type == 'excel_import'

    new_df_import_step = mito.steps_including_skipped[3]
    assert new_df_import_step.step_type == 'dataframe_import'

    assert mito.curr_step.df_names == ['csv_file', 'Sheet3', 'df2']

    os.remove(TEST_EXCEL_FILE)
    os.remove(TEST_CSV_FILE)


def test_replay_steps_correctly():
    # Make dataframes and files for test
    df1 = pd.DataFrame(data={'A': [1, 2, 3]})
    df1.to_csv(TEST_CSV_FILE, index=True)
    df2 = pd.DataFrame(data={'A': [10, 20, 30]})
    df2.to_csv(TEST_CSV_FILE_TWO, index=True)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_CSV_FILE])
    step_id = mito.curr_step.step_id

    mito.set_formula('=A', 0, 'B', True)

    # Update the imports 
    updated_import_obj = [ 
        {
           'step_id': step_id,
            'type': 'csv',
            'import_params': {
                'file_names': [TEST_CSV_FILE_TWO],
                'delimeters': [','],
                'encodings': ['utf-8'],
                'error_bad_lines': [False],
            }
        }
    ]

    mito.update_existing_imports(updated_import_obj)

    # Make sure the updates occured correctly 
    assert mito.get_value(0, 'A', 1) == 10