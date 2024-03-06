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
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import DEFAULT_DECIMAL, DEFAULT_DELIMITER, DEFAULT_ENCODING, DEFAULT_SKIPROWS

from mitosheet.tests.test_utils import create_mito_wrapper
from mitosheet.utils import is_prev_version

TEST_FILE_PATHS = [
    'test_file.csv',
    'test_file1.csv'
]

FAKE_FILE_PATHS = [
    'never_exists.csv'
]

SIMPLE_IMPORT_TESTS = [
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        ';', 
        'utf-8',
        '.',
        0,
        False
    ),
    (
        pd.DataFrame({'A': [1, 2, 3]}),
        '|', 
        'big5',
        '.',
        0,
        True
    ),
]
@pytest.mark.parametrize("input_df, delimeter, encoding, decimal, skiprows, error_bad_lines", SIMPLE_IMPORT_TESTS)
def test_simple_import(input_df, delimeter, encoding, decimal, skiprows, error_bad_lines):
    input_df.to_csv(TEST_FILE_PATHS[0], index=False, sep=delimeter, encoding=encoding)

    # Create with no dataframes
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]], [delimeter], [encoding], [decimal], [skiprows], [error_bad_lines])

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(input_df)

def test_rolls_back_on_failed_import():

    # Create with no dataframes
    mito = create_mito_wrapper()
    # And then import just a test file, that does not exist
    mito.simple_import([FAKE_FILE_PATHS[0]])

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert len(mito.steps_including_skipped) == 1
    assert len(mito.dfs) == 0


def test_can_import_a_single_csv():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper()
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
    mito = create_mito_wrapper()
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
    mito = create_mito_wrapper()
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
    mito = create_mito_wrapper()
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
    mito = create_mito_wrapper()
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
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])

    os.remove(TEST_FILE_PATHS[0])

def test_transpiles_single_file_with_column_rename():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])

    os.remove(TEST_FILE_PATHS[0])

def test_transpiles_single_file_and_add_formula():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.set_formula('=A + 1', 0, 'C', add_column=True)

    os.remove(TEST_FILE_PATHS[0])

def test_transpiles_multiple_files_same_name():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0], TEST_FILE_PATHS[0]])

    os.remove(TEST_FILE_PATHS[0])


def test_imports_with_different_delimeters():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})

    delimeters = [';', '|', ':', '\t', ' ']
    for delimeter in delimeters:
        df.to_csv(TEST_FILE_PATHS[0], index=False, sep=delimeter)

        # Create with no dataframes
        mito = create_mito_wrapper()
        # And then import just a test file
        mito.simple_import([TEST_FILE_PATHS[0]])

        assert mito.dfs[0].equals(df)

        os.remove(TEST_FILE_PATHS[0])


def test_imports_with_utf_16():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})

    encoding = 'UTF-16'
    df.to_csv(TEST_FILE_PATHS[0], index=False, encoding=encoding)

    # Create with no dataframes
    mito = create_mito_wrapper()
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
        mito = create_mito_wrapper()
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
        mito = create_mito_wrapper()
        # And then import just a test file
        mito.simple_import([TEST_FILE_PATHS[0]])

        assert mito.dfs[0].equals(df)

        os.remove(TEST_FILE_PATHS[0])


def test_can_import_mulitple_csvs_combined():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])
    mito.simple_import([TEST_FILE_PATHS[0]])

    # Make sure a step has been created, and that the dataframe is the correct dataframe
    assert mito.curr_step.step_type == 'simple_import'
    assert len(mito.dfs) == 2
    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(df)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "import pandas as pd",
        '',
        "test_file = pd.read_csv(r'test_file.csv')",
        "test_file_1 = pd.read_csv(r'test_file.csv')",
        '',
    ]

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])

def test_simple_import_optimized_by_delete():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper()
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
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0], TEST_FILE_PATHS[0]])
    mito.delete_dataframe(0)

    assert len(mito.dfs) == 1

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "import pandas as pd",
        '',
        "test_file = pd.read_csv(r'test_file.csv')",
        "test_file_1 = pd.read_csv(r'test_file.csv')",
        '',
    ]

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])


def test_multiple_imports_are_deleted_by_mulitple_delete():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper()
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
    mito = create_mito_wrapper()
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
    mito = create_mito_wrapper(df)
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
    mito = create_mito_wrapper()
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
    mito = create_mito_wrapper(df)
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

def test_skip_invalid_lines():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    with open(TEST_FILE_PATHS[0], 'w+') as f:
        f.write("""FirstName,LastName,Team,Position,JerseyNumber,Salary,Birthdate
Joe,Pavelski,SJ,C,8,6000000,1984-07-11
Connor,Mc,David,EDM,C,97,925000,1997-01-13
Sidney ,Crosby,PIT,C,87,8700000,1987-08-07
Carey,Price,MTL,G,31,10,500,000,1987-08-16
Daniel,Sedin,VAN,LW,22,1,1980-09-26
Henrik,Sedin,VAN,C,33,1,1980-09-26""")

    mito = create_mito_wrapper()
    mito.simple_import([TEST_FILE_PATHS[0]], [DEFAULT_DELIMITER], [DEFAULT_ENCODING], [DEFAULT_DECIMAL], [DEFAULT_SKIPROWS], [True])
    
    assert len(mito.dfs) == 0

    mito.simple_import([TEST_FILE_PATHS[0]], [DEFAULT_DELIMITER], [DEFAULT_ENCODING], [DEFAULT_DECIMAL], [DEFAULT_SKIPROWS], [False])


    from io import StringIO

    TESTDATA = StringIO("""FirstName,LastName,Team,Position,JerseyNumber,Salary,Birthdate
Joe,Pavelski,SJ,C,8,6000000,1984-07-11
Connor,Mc,David,EDM,C,97,925000,1997-01-13
Sidney ,Crosby,PIT,C,87,8700000,1987-08-07
Carey,Price,MTL,G,31,10,500,000,1987-08-16
Daniel,Sedin,VAN,LW,22,1,1980-09-26
Henrik,Sedin,VAN,C,33,1,1980-09-26""")

    if is_prev_version(pd.__version__, '1.3.0'):
        df = pd.read_csv(TESTDATA, error_bad_lines=False)
    else:
        df = pd.read_csv(TESTDATA, on_bad_lines='skip')
    assert mito.dfs[0].equals(df)
    assert len(mito.dfs[0].index) == 4

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])


def test_comma_decimal():
    df_comma = pd.DataFrame({'KG': ['267,88', '458,99', '125,89', '1,55', '1']}) 
    df_result = pd.DataFrame({'KG': [267.88, 458.99, 125.89, 1.55, 1]}) 
    df_comma.to_csv(TEST_FILE_PATHS[0], index=False)

    mito = create_mito_wrapper()
    mito.simple_import([TEST_FILE_PATHS[0]], [DEFAULT_DELIMITER], [DEFAULT_ENCODING], [','], [DEFAULT_SKIPROWS], [True])
    
    assert mito.dfs[0].equals(df_result)

     # Remove the test file
    os.remove(TEST_FILE_PATHS[0])

def test_can_import_with_skiprows():
    df = pd.DataFrame(data={'A': ['B', 2, 3], 'C': ['D', 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]], [DEFAULT_DELIMITER], [DEFAULT_ENCODING], [DEFAULT_DECIMAL], [1], [True])

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(pd.DataFrame({
        'B': [2, 3], 'D': [3, 4]
    }))

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])

def test_can_import_with_invalid_name():
    file_path = 'return.csv'
    df = pd.DataFrame(data={'A': ['B', 2, 3], 'C': ['D', 3, 4]})
    df.to_csv(file_path, index=False)

    # Create with no dataframes
    mito = create_mito_wrapper()
    # And then import just a test file
    mito.simple_import([file_path], [DEFAULT_DELIMITER], [DEFAULT_ENCODING], [DEFAULT_DECIMAL], [1], [True])

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(pd.DataFrame({
        'B': [2, 3], 'D': [3, 4]
    }))
    assert mito.df_names == ['return_df']

    # Remove the test file
    os.remove(file_path)

