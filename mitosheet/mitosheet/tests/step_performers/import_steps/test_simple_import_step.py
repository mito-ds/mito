#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for simple import steps
"""
import pytest
import pandas as pd
import os

from mitosheet.tests.test_utils import create_mito_wrapper_dfs

TEST_FILE_PATHS = [
    'test_file.csv',
    'test_file1.csv'
]

FAKE_FILE_PATHS = [
    'never_exists.csv'
]

def test_rolls_back_on_failed_import():

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file, that does not exist
    mito.simple_import([FAKE_FILE_PATHS[0]])

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert len(mito.steps_including_skipped) == 1
    assert len(mito.dfs) == 0


def test_can_import_a_single_csv():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert mito.curr_step.step_type == 'simple_import'
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(df)

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])

@pytest.mark.skip('Error in delimeter detection, just noting')
def test_can_import_a_single_csv_with_a_single_column():
    df = pd.DataFrame(data={'date': [1, 2, 3]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert mito.curr_step.step_type == 'simple_import'
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(df)

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])

def test_creates_valid_name():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv('1.csv', index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import(['1.csv'])

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert mito.curr_step.step_type == 'simple_import'
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(df)

    # Remove the test file
    os.remove('1.csv')


def test_creates_valid_name_nested_path():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv('../1.csv', index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import(['../1.csv'])

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert mito.curr_step.step_type == 'simple_import'
    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(df)

    # Remove the test file
    os.remove('../1.csv')


def test_can_import_multiple_csv():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)
    df.to_csv(TEST_FILE_PATHS[1], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import(TEST_FILE_PATHS)

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert mito.curr_step.step_type == 'simple_import'
    assert len(mito.dfs) == 2
    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(df)

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])
    os.remove(TEST_FILE_PATHS[1])

def test_transpiles_single_file():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])

    os.remove(TEST_FILE_PATHS[0])

def test_transpiles_single_file_with_column_rename():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])

    os.remove(TEST_FILE_PATHS[0])

def test_transpiles_single_file_and_add_formula():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.set_formula('=A + 1', 0, 'C', add_column=True)

    os.remove(TEST_FILE_PATHS[0])

def test_transpiles_multiple_files_same_name():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0], TEST_FILE_PATHS[0]])

    os.remove(TEST_FILE_PATHS[0])


def test_imports_with_different_delimeters():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})

    delimeters = [';', '|', ':', '\t', ' ']
    for delimeter in delimeters:
        df.to_csv(TEST_FILE_PATHS[0], index=False, sep=delimeter)

        # Create with no dataframes
        mito = create_mito_wrapper_dfs()
        # And then import just a test file
        mito.simple_import([TEST_FILE_PATHS[0]])

        assert mito.dfs[0].equals(df)

        os.remove(TEST_FILE_PATHS[0])


def test_imports_with_utf_16():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})

    encoding = 'UTF-16'
    df.to_csv(TEST_FILE_PATHS[0], index=False, encoding=encoding)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])

    assert mito.dfs[0].equals(df)

    os.remove(TEST_FILE_PATHS[0])


def test_imports_with_different_encodings_that_python_handles():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})

    encodings = ['855', 'big5-tw', 'windows-1254', 'iso2022jp-1']
    for encoding in encodings:
        df.to_csv(TEST_FILE_PATHS[0], index=False, encoding=encoding)

        # Create with no dataframes
        mito = create_mito_wrapper_dfs()
        # And then import just a test file
        mito.simple_import([TEST_FILE_PATHS[0]])

        assert mito.dfs[0].equals(df)

        os.remove(TEST_FILE_PATHS[0])


def test_imports_with_latin_1():
    df = pd.DataFrame(data={'A': ['Ñ']})

    encodings = ['latin-1']
    for encoding in encodings:
        df.to_csv(TEST_FILE_PATHS[0], index=False, encoding=encoding)

        # Create with no dataframes
        mito = create_mito_wrapper_dfs()
        # And then import just a test file
        mito.simple_import([TEST_FILE_PATHS[0]])

        assert mito.dfs[0].equals(df)

        os.remove(TEST_FILE_PATHS[0])


def test_can_import_mulitple_csvs_combined():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.simple_import([TEST_FILE_PATHS[0]])

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert mito.curr_step.step_type == 'simple_import'
    assert len(mito.dfs) == 2
    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(df)

    assert mito.transpiled_code == [
        "import pandas as pd",
        "test_file = pd.read_csv(r'test_file.csv')",
        "test_file_1 = pd.read_csv(r'test_file.csv')"
    ]

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])

def test_simple_import_optimized_by_delete():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.delete_dataframe(0)

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert len(mito.dfs) == 0

    assert mito.transpiled_code == []
    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])

def test_multiple_imports_are_not_deleted_by_single_delete():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0], TEST_FILE_PATHS[0]])
    mito.delete_dataframe(0)

    assert len(mito.dfs) == 1

    assert mito.transpiled_code == [
        "import pandas as pd",
        "test_file = pd.read_csv(r'test_file.csv')",
        "test_file_1 = pd.read_csv(r'test_file.csv')",
        "del test_file"
    ]

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])


def test_multiple_imports_are_deleted_by_mulitple_delete():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0], TEST_FILE_PATHS[0]])
    mito.delete_dataframe(0)
    mito.delete_dataframe(0)

    assert len(mito.dfs) == 0

    assert mito.transpiled_code == []

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])

def test_multiple_seperate_imports_analysis_are_deleted_by_mulitple_delete():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.delete_dataframe(0)
    mito.delete_dataframe(0)

    assert len(mito.dfs) == 0

    assert mito.transpiled_code == []

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])

def test_multiple_seperate_imports_analysis_are_deleted_by_mulitple_delete_later_in_analysis():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs(df)
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.delete_dataframe(1)
    mito.delete_dataframe(1)

    assert len(mito.dfs) == 1

    assert mito.transpiled_code == []

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])


def test_multiple_imports_deleted_with_events_in_between():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.add_column(1, 'C', '=0')
    mito.delete_dataframe(0)
    mito.delete_dataframe(0)

    assert mito.transpiled_code == []

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])


def test_multiple_imports_optimize_stopped_by_rename():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs(df)
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.add_column(1, 'C', '=0')
    mito.rename_dataframe(0, 'newly_named_df')
    mito.delete_dataframe(1)
    mito.delete_dataframe(1)

    assert len(mito.transpiled_code) > 2

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])