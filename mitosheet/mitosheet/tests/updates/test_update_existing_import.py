#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for existing import update events.
"""
import pandas as pd
import os
import json
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import DEFAULT_DECIMAL
from mitosheet.tests.test_utils import create_mito_wrapper_with_data, create_mito_wrapper
from mitosheet.tests.decorators import pandas_post_1_only, pandas_post_1_4_only, python_post_3_6_only

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
    mito = create_mito_wrapper()
    # And then import three sheets from the excel file
    mito.excel_import(TEST_EXCEL_FILE, ['Sheet1', 'Sheet2', 'Sheet3'], True, 0, DEFAULT_DECIMAL)

    step_id = mito.curr_step.step_id

    # Update the imports 
    updated_import_obj = [
        {
            'step_id': step_id,
            'imports': [
                {
                    'step_type': 'simple_import',
                    'params': {
                        'file_names': [TEST_CSV_FILE],
                        'delimeters': [','],
                        'encodings': ['utf-8'],
                        'error_bad_lines': [False],
                    }
                },
                {
                    'step_type': 'excel_import',
                    'params': {
                        'file_name': TEST_EXCEL_FILE,
                        'sheet_names': ['Sheet3'],
                        'has_headers': True,
                        'skiprows': 0,
                        'decimal': '.'
                    }
                },
                {
                    'step_type': 'dataframe_import',
                    'params': {
                        'df_names': ['df2']
                    }
                }
            ]
            
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
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_CSV_FILE])
    step_id = mito.curr_step.step_id

    mito.set_formula('=A', 0, 'B', True)

    # Update the imports 
    updated_import_obj = [ 
        {
           'step_id': step_id,
           'imports': [
                {
                    'step_type': 'simple_import',
                    'params': {
                        'file_names': [TEST_CSV_FILE_TWO],
                        'delimeters': [','],
                        'encodings': ['utf-8'],
                        'error_bad_lines': [False],
                    }
                }
           ]
        }
    ]

    mito.update_existing_imports(updated_import_obj)

    # Make sure the updates occured correctly 
    assert mito.dfs[0].equals(pd.DataFrame({'Unnamed: 0': [0, 1, 2], 'A': [10, 20, 30], 'B': [10, 20, 30]}))

    # Remove the test files
    os.remove(TEST_CSV_FILE)
    os.remove(TEST_CSV_FILE_TWO)

def test_undo_works():
    # Make dataframes and files for test
    df1 = pd.DataFrame(data={'A': [1, 2, 3]})
    df1.to_csv(TEST_CSV_FILE, index=True)
    df2 = pd.DataFrame(data={'A': [10, 20, 30]})
    df2.to_csv(TEST_CSV_FILE_TWO, index=True)

    # Create with no dataframes
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_CSV_FILE])
    step_id = mito.curr_step.step_id

    mito.set_formula('=A', 0, 'B', True)

    # Update the imports 
    updated_import_obj = [ 
        {
           'step_id': step_id,
           'imports': [
                {
                    'step_type': 'simple_import',
                    'params': {
                        'file_names': [TEST_CSV_FILE_TWO],
                        'delimeters': [','],
                        'encodings': ['utf-8'],
                        'error_bad_lines': [False],
                    }
                }
           ]
        }
    ]

    mito.update_existing_imports(updated_import_obj)
    mito.undo()

    # Make sure the updates occured correctly 
    assert mito.dfs[0].equals(pd.DataFrame({'Unnamed: 0': [0, 1, 2], 'A': [1, 2, 3], 'B': [1, 2, 3]}, index=[0, 1, 2]))

    # Remove the test files
    os.remove(TEST_CSV_FILE)
    os.remove(TEST_CSV_FILE_TWO)


def test_redo_works():
    # Make dataframes and files for test
    df1 = pd.DataFrame(data={'A': [1, 2, 3]})
    df1.to_csv(TEST_CSV_FILE, index=True)
    df2 = pd.DataFrame(data={'A': [10, 20, 30]})
    df2.to_csv(TEST_CSV_FILE_TWO, index=True)

    # Create with no dataframes
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_CSV_FILE])
    step_id = mito.curr_step.step_id

    mito.set_formula('=A', 0, 'B', True)

    # Update the imports 
    updated_import_obj = [ 
        {
           'step_id': step_id,
           'imports': [
                {
                    'step_type': 'simple_import',
                    'params': {
                        'file_names': [TEST_CSV_FILE_TWO],
                        'delimeters': [','],
                        'encodings': ['utf-8'],
                        'error_bad_lines': [False],
                    }
                }
           ]
        }
    ]

    mito.update_existing_imports(updated_import_obj)
    mito.redo()

    # Make sure the updates occured correctly 
    assert mito.dfs[0].equals(pd.DataFrame({'Unnamed: 0': [0, 1, 2], 'A': [1, 2, 3], 'B': [1, 2, 3]}, index=[0, 1, 2]))

    # Remove the test files
    os.remove(TEST_CSV_FILE)
    os.remove(TEST_CSV_FILE_TWO)


@pandas_post_1_only
@python_post_3_6_only
def test_update_imports_is_atomic():
    # Make dataframes and files for test
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df1 = pd.DataFrame(data={'C': [1, 2, 3], 'D': [2, 3, 4]})
    df1.to_csv(TEST_CSV_FILE, index=False, sep=',', encoding='utf-8')
    with pd.ExcelWriter(TEST_EXCEL_FILE) as writer:  
        df.to_excel(writer, sheet_name='Sheet1', index=False)
    
    # Create with no dataframes
    mito = create_mito_wrapper()
    mito.excel_import(TEST_EXCEL_FILE, ['Sheet1'], True, 0, DEFAULT_DECIMAL)
    mito.simple_import([TEST_CSV_FILE])

    mito.update_existing_imports([
        {
            'step_id': mito.steps_including_skipped[1].step_id,
            'imports': [{
                'step_type': 'simple_import',
                'params': {
                    'file_names': [TEST_CSV_FILE]
                }
            }]
        },
        {
            'step_id': mito.steps_including_skipped[2].step_id,
            'imports': [{
                'step_type': 'simple_import',
                'params': {
                    'file_names': ['no such file']
                }
            }]
        }
    ])

    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(df1)

    # Remove the test files
    os.remove(TEST_CSV_FILE)
    os.remove(TEST_EXCEL_FILE)


@pandas_post_1_only
@python_post_3_6_only
def test_update_imports_with_multiple_imports_per_step():
    # Make dataframes and files for test
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df1 = pd.DataFrame(data={'C': [1, 2, 3], 'D': [2, 3, 4]})
    df.to_csv(TEST_CSV_FILE, index=False, sep=',', encoding='utf-8')
    df1.to_csv(TEST_CSV_FILE_TWO, index=False, sep=',', encoding='utf-8')
    with pd.ExcelWriter(TEST_EXCEL_FILE) as writer:  
        df.to_excel(writer, sheet_name='Sheet1', index=False)
    
    # Create with no dataframes
    mito = create_mito_wrapper()
    mito.simple_import([TEST_CSV_FILE, TEST_CSV_FILE])
    mito.excel_import(TEST_EXCEL_FILE, ['Sheet1'], True, 0, DEFAULT_DECIMAL)

    mito.update_existing_imports([
        {
            'step_id': mito.steps_including_skipped[1].step_id,
            'imports': [
                {
                    'step_type': 'simple_import',
                    'params': {
                        'file_names': [TEST_CSV_FILE_TWO]
                    }
                },
                {
                    'step_type': 'simple_import',
                    'params': {
                        'file_names': [TEST_CSV_FILE_TWO]
                    }
                },
            ]
        },
        {
            'step_id': mito.steps_including_skipped[2].step_id,
            'imports': [{
                'step_type': 'simple_import',
                'params': {
                    'file_names': [TEST_CSV_FILE_TWO]
                }
            }]
        }
    ])

    assert mito.dfs[0].equals(df1)
    assert mito.dfs[1].equals(df1)
    assert mito.dfs[2].equals(df1)

    # Remove the test files
    os.remove(TEST_CSV_FILE)
    os.remove(TEST_EXCEL_FILE)


@pandas_post_1_only
@python_post_3_6_only
def test_test_import_returns_good_data():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df1 = pd.DataFrame(data={'C': [1, 2, 3], 'D': [2, 3, 4]})
    df1.to_csv(TEST_CSV_FILE, index=False, sep=',', encoding='utf-8')
    with pd.ExcelWriter(TEST_EXCEL_FILE) as writer:  
        df.to_excel(writer, sheet_name='Sheet1', index=False)

    from mitosheet.api.get_test_imports import get_test_imports, DATAFRAME_IMPORT_ERROR, CSV_IMPORT_ERROR, EXCEL_IMPORT_ERROR
    import json

    mito = create_mito_wrapper()

    result = get_test_imports({
        'updated_step_import_data_list': [
        {
            'step_id': 'fake_id',
            'imports': [{
                'step_type': 'simple_import',
                'params': {
                    'file_names': [TEST_CSV_FILE]
                }
            }]
        },
        {
            'step_id': 'fake_id',
            'imports': [{
                'step_type': 'simple_import',
                'params': {
                    'file_names': ['no such file']
                }
            }]
        },
        {
            'step_id': 'fake_id',
            'imports': [{
                'step_type': 'excel_import',
                'params': {
                    'file_name': TEST_EXCEL_FILE,
                    'sheet_names': ['Sheet1'],
                    'has_headers': True,
                    'skiprows': 0,
                    'decimal': '.'
                }
            }]
        },
        {
            'step_id': 'fake_id',
            'imports': [{
                'step_type': 'excel_import',
                'params': {
                    'file_name': 'fake_file',
                    'sheet_names': ['Sheet1'],
                    'has_headers': True,
                    'skiprows': 0,
                    'decimal': '.'
                }
            }]
        },
        {
            'step_id': 'fake_id',
            'imports': [{
                'step_type': 'dataframe_import',
                'params': {
                    'df_names': ['df1']
                }
            }]
        },
        {
            'step_id': 'fake_id',
            'imports': [{
                'step_type': 'dataframe_import',
                'params': {
                    'df_names': ['df100000fake']
                }
            }]
        }
    ]}, mito.mito_backend.steps_manager)

    assert result[1] == 'no such file does not exist.'
    assert result[3] == 'fake_file does not exist.'
    assert result[5] == DATAFRAME_IMPORT_ERROR
    assert len(result) == 3

    # Remove the test files
    os.remove(TEST_CSV_FILE)
    os.remove(TEST_EXCEL_FILE)


@pandas_post_1_only
@python_post_3_6_only
def test_test_import_correct_index_for_multiple_items_in_one_step():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df1 = pd.DataFrame(data={'C': [1, 2, 3], 'D': [2, 3, 4]})
    df1.to_csv(TEST_CSV_FILE, index=False, sep=',', encoding='utf-8')
    with pd.ExcelWriter(TEST_EXCEL_FILE) as writer:  
        df.to_excel(writer, sheet_name='Sheet1', index=False)

    from mitosheet.api.get_test_imports import get_test_imports, DATAFRAME_IMPORT_ERROR, CSV_IMPORT_ERROR, EXCEL_IMPORT_ERROR
    import json

    mito = create_mito_wrapper()

    result = get_test_imports({
        'updated_step_import_data_list': [
        {
            'step_id': 'fake_id',
            'imports': [
                {
                    'step_type': 'simple_import',
                    'params': {
                        'file_names': [TEST_CSV_FILE]
                    }
                },
                {
                    'step_type': 'simple_import',
                    'params': {
                        'file_names': ['no such file']
                    }
                },
                {
                    'step_type': 'simple_import',
                    'params': {
                        'file_names': [TEST_CSV_FILE]
                    }
                },
                {
                    'step_type': 'simple_import',
                    'params': {
                        'file_names': ['no such file']
                    }
                }
            ]
        },
    ]}, mito.mito_backend.steps_manager)

    assert result[1] == 'no such file does not exist.'
    assert result[3] == 'no such file does not exist.'
    assert len(result) == 2

    # Remove the test files
    os.remove(TEST_CSV_FILE)
    os.remove(TEST_EXCEL_FILE)


@pandas_post_1_4_only
@python_post_3_6_only
def test_update_imports_replays_unchanged_files_correctly_from_steps():
    # Make dataframes and files for test
    df1 = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df2 = pd.DataFrame(data={'A': ['1,23', '2,0', '3,5'], 'B': [2, 3, 4]})
    df2_result = pd.DataFrame(data={'A': [1.23, 2.0, 3.5], 'B': [2, 3, 4]})

    encoding = 'utf-16'
    df2.to_csv(TEST_CSV_FILE, index=False, sep=',', encoding=encoding)
    with pd.ExcelWriter(TEST_EXCEL_FILE) as writer:  
        df2.to_excel(writer, sheet_name='Sheet1', index=False)
    
    # Create with no dataframes
    mito = create_mito_wrapper(df1)
    mito.simple_import([TEST_CSV_FILE], [','], [encoding], [','], [0], [False])
    mito.excel_import(TEST_EXCEL_FILE, ['Sheet1'], True, 0, ',')

    # Test that all parameters are handled properly from get_imported_files_and_dataframes_from_current_steps
    # by making sure that the dataframes are the same when the import configuration is not changed
    from mitosheet.api.get_imported_files_and_dataframes_from_current_steps import get_imported_files_and_dataframes_from_current_steps
    import_data = get_imported_files_and_dataframes_from_current_steps({}, mito.mito_backend.steps_manager)
    
    assert import_data[0]['imports'][0]['params']['file_names'] == [TEST_CSV_FILE]
    assert import_data[0]['imports'][0]['params']['delimeters'] == [',']
    assert import_data[0]['imports'][0]['params']['encodings'] == [encoding]
    assert import_data[0]['imports'][0]['params']['decimals'] == [","]
    assert import_data[0]['imports'][0]['params']['skiprows'] == [0]
    assert import_data[0]['imports'][0]['params']['error_bad_lines'] == [False]

    assert import_data[1]['imports'][0]['params']['file_name'] == TEST_EXCEL_FILE
    assert import_data[1]['imports'][0]['params']['sheet_names'] == ['Sheet1']
    assert import_data[1]['imports'][0]['params']['has_headers'] == True
    assert import_data[1]['imports'][0]['params']['skiprows'] == 0
    assert import_data[1]['imports'][0]['params']['decimal'] == ','

    mito.update_existing_imports(import_data)

    assert mito.dfs[0].equals(df1)
    assert mito.dfs[1].equals(df2_result)
    assert mito.dfs[2].equals(df2_result)

    # Remove the test files
    os.remove(TEST_CSV_FILE)
    os.remove(TEST_EXCEL_FILE)


@pandas_post_1_4_only
@python_post_3_6_only
def test_update_imports_replays_unchanged_files_correctly_from_analysis_name():
    # Make dataframes and files for test
    df1 = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df2 = pd.DataFrame(data={'A': ['1,23', '2,0', '3,5'], 'B': [2, 3, 4]})
    df2_result = pd.DataFrame(data={'A': [1.23, 2.0, 3.5], 'B': [2, 3, 4]})

    encoding = 'utf-16'
    df2.to_csv(TEST_CSV_FILE, index=False, sep=',', encoding=encoding)
    with pd.ExcelWriter(TEST_EXCEL_FILE) as writer:  
        df2.to_excel(writer, sheet_name='Sheet1', index=False)
    
    # Create with no dataframes
    mito = create_mito_wrapper(df1)
    mito.simple_import([TEST_CSV_FILE], [','], [encoding], [','], [0], [False])
    mito.excel_import(TEST_EXCEL_FILE, ['Sheet1'], True, 0, ',')

    # Test that all parameters are handled properly from get_imported_files_and_dataframes_from_current_steps
    # by making sure that the dataframes are the same when the import configuration is not changed
    from mitosheet.api.get_imported_files_and_dataframes_from_analysis_name import get_imported_files_and_dataframes_from_analysis_name
    import_data = get_imported_files_and_dataframes_from_analysis_name({'analysis_name': mito.mito_backend.analysis_name, 'args': []}, mito.mito_backend.steps_manager)

    assert import_data[0]['imports'][0]['params']['file_names'] == [TEST_CSV_FILE]
    assert import_data[0]['imports'][0]['params']['delimeters'] == [',']
    assert import_data[0]['imports'][0]['params']['encodings'] == [encoding]
    assert import_data[0]['imports'][0]['params']['decimals'] == [","]
    assert import_data[0]['imports'][0]['params']['skiprows'] == [0]
    assert import_data[0]['imports'][0]['params']['error_bad_lines'] == [False]

    assert import_data[1]['imports'][0]['params']['file_name'] == TEST_EXCEL_FILE
    assert import_data[1]['imports'][0]['params']['sheet_names'] == ['Sheet1']
    assert import_data[1]['imports'][0]['params']['has_headers'] == True
    assert import_data[1]['imports'][0]['params']['skiprows'] == 0
    assert import_data[1]['imports'][0]['params']['decimal'] == ','

    mito.update_existing_imports(import_data)
    
    assert mito.dfs[0].equals(df1)
    assert mito.dfs[1].equals(df2_result)
    assert mito.dfs[2].equals(df2_result)


    # Remove the test files
    os.remove(TEST_CSV_FILE)
    os.remove(TEST_EXCEL_FILE)


@pandas_post_1_4_only
@python_post_3_6_only
def test_update_user_defined_imports():

    def create_df_one(column_name: str):
        return pd.DataFrame(data={column_name: [1, 2, 3], 'B': [2, 3, 4]})

    def create_df_two(negative: bool):
        if negative:
            return pd.DataFrame(data={'C': [-1, -2, -3], 'D': [-2, -3, -4]})
        else: 
            return pd.DataFrame(data={'C': [1, 2, 3], 'D': [2, 3, 4]})


    # Create user defined import functions
    mito = create_mito_wrapper(importers=[create_df_one, create_df_two])
    mito.user_defined_import("create_df_one", {'column_name': 'A'})

    # Test that all parameters are handled properly from get_imported_files_and_dataframes_from_current_steps
    # by making sure that the dataframes are the same when the import configuration is not changed
    from mitosheet.api.get_imported_files_and_dataframes_from_analysis_name import get_imported_files_and_dataframes_from_analysis_name
    import_data = get_imported_files_and_dataframes_from_analysis_name({'analysis_name': mito.mito_backend.analysis_name, 'args': []}, mito.mito_backend.steps_manager)

    assert import_data[0]['imports'][0]['params']['importer'] == 'create_df_one'
    assert import_data[0]['imports'][0]['params']['importer_params']['column_name'] == 'A'

    mito.update_existing_imports([
        {
            'step_id': mito.steps_including_skipped[1].step_id,
            'imports': [{
                'step_type': 'user_defined_import',
                'params': {
                    'importer': 'create_df_two',
                    'importer_params': {
                        'negative': 'True'
                    }
                    
                }
            }]
        },
    ])
    
    assert mito.dfs[0].equals(pd.DataFrame(data={'C': [-1, -2, -3], 'D': [-2, -3, -4]}))


