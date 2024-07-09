#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Excel Range Import
"""

import os
import numpy as np

import pandas as pd
import pytest

from mitosheet.errors import MitoError
from mitosheet.excel_utils import get_col_and_row_indexes_from_range
from mitosheet.public.v2 import get_table_range
from mitosheet.tests.decorators import (pandas_post_1_2_only,
                                        python_post_3_6_only)
from mitosheet.tests.test_utils import create_mito_wrapper

TEST_FILE_PATH = "test_file.xlsx"
TEST_FILE_CSV_PATH = "test_file.csv"
TEST_SHEET_NAME = 'sheet1'
TEST_FILE_PATH_2 = "test_file2.xlsx"
TEST_SHEET_NAME_2 = 'sheet2'
TEST_DF_1 = pd.DataFrame({'header 1': [1], 'header 2': [2]})
TEST_DF_2 = pd.DataFrame({'header 100': [3], 'header 200': [4]})
TEST_DF_3 = pd.DataFrame({'header 101': [100, 200, 300], 'header 201': [200, 300, 400]})
TEST_DF_4 = pd.DataFrame({'header 102': ['abc', 'def'], 'header 202': ['hig', 'jkl']})
TEST_DF_5 = pd.DataFrame({'A': ['abc', 'def'], 'B': ['abc', 'def'], 'C': ['abc', 'dev'], 'D': ['abc', 'dev'], 'E': ['abc', 'dev']})
TEST_DF_6 = pd.DataFrame({1: [1, 1, 1], 2: [2, 2, 2]})
TEST_DF_7 = pd.DataFrame({'A': [1.0, 2.0, None, None], 'B': [1.0, 2.0, None, None], 'C': [None, 2, 3, None], 'D': [1, 2, 3, 4]})
TEST_DF_8 = pd.DataFrame({'A': [None, 'A']})

EXCEL_RANGE_IMPORT_TESTS = [
    (
        ['A1:B2'],
        [TEST_DF_1],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'A1:B2'}],
        [TEST_DF_1],
    ),
    (
        ['A1:B2'],
        [TEST_DF_1],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_1.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_1],
    ),
    (   
        ['AA100:AB101'],
        [TEST_DF_1],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'AA100:AB101'}],
        [TEST_DF_1],
    ),
    (
        ['AA100:AB101'],
        [TEST_DF_1],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_1.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_1],
    ),
    (
        ['A1:E3'],
        [TEST_DF_5],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_5.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_5],
    ),
    (
        ['A1:G100'],
        [TEST_DF_1],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_1.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_1],
    ),
    (   
        ['B2:A1'],
        [TEST_DF_1],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'B2:A1'}],
        [TEST_DF_1],
    ),
    (
        ['A1:B4'],
        [TEST_DF_3],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'A1:B4'}],
        [TEST_DF_3],
    ),
    (
        ['A1:B4'],
        [TEST_DF_3],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_3.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_3],
    ),
    (
        ['A1:B2', 'A4:B5'],
        [TEST_DF_1, TEST_DF_2],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'A1:B2'}, {'type': 'range', 'df_name': 'dataframe_2',  'value': 'A4:B5'}],
        [TEST_DF_1, TEST_DF_2],
    ),
    (
        ['A1:B2', 'A4:B5'],
        [TEST_DF_1, TEST_DF_2],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_1.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}, {'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_2.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_2'}],
        [TEST_DF_1, TEST_DF_2],
    ),
    (
        ['A1:B2', 'A4:B5'],
        [TEST_DF_1, TEST_DF_2],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_1.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}, {'type': 'range', 'df_name': 'dataframe_2',  'value': 'A4:B5'}],
        [TEST_DF_1, TEST_DF_2],
    ),
    (
        ['A1:B2', 'A4:B5'],
        [TEST_DF_1, TEST_DF_2],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_1.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'a bad dataframe name'}, {'type': 'range', 'df_name': '97 also bad', 'value': 'A4:B5'}],
        [TEST_DF_1, TEST_DF_2],
    ),
    (
        ['A1:B2', 'A4:B5'],
        [TEST_DF_1, TEST_DF_2],
        [{'type': 'range', 'df_name': 'a bad dataframe name', 'value': 'A1:B2'}, {'type': 'range', 'df_name': '97 also bad', 'value': 'A4:B5'}],
        [TEST_DF_1, TEST_DF_2],
    ),
    # End before end of dataframe
    (
        ['A1:B4'],
        [TEST_DF_3],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_3.columns[0]}, 'end_condition': {'type': 'bottom left corner value', 'value': 200}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_3.iloc[0:2]],
    ),
    # Have a NaN value in the middle
    (
        ['A1:B2', 'A4:B5'],
        [pd.DataFrame({'A': [1]}), pd.DataFrame({'B': [100]})],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 'A'}, 'end_condition': {'type': 'bottom left corner value', 'value': 100}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [pd.DataFrame({'A': [1, None, 'B', 100]})],
    ),
    # End on a string
    (
        ['A1:B2', 'A4:B5'],
        [pd.DataFrame({'A': [1]}), pd.DataFrame({'B': [100]})],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 'A'}, 'end_condition': {'type': 'bottom left corner value', 'value': 'B'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [pd.DataFrame({'A': [1, None, 'B']})],
    ),
    # Have empty cells in the final row
    (
        ['A1:B2', 'A4:B5'],
        [pd.DataFrame({'A': [1], 'D': [1]}), pd.DataFrame({'B': [100], 'C': [None]})],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 'A'}, 'end_condition': {'type': 'bottom left corner value', 'value': 'B'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [pd.DataFrame({'A': [1, None, 'B'], 'D': [1, None, 'C']})],
    ),
    (
        ['A1:E3'],
        [TEST_DF_5],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_5.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'num columns', 'value': 1}, 'df_name': 'dataframe_1'}],
        [TEST_DF_5.iloc[:, :1]],
    ),
    (
        ['A1:E3'],
        [TEST_DF_5],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_5.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'num columns', 'value': 3}, 'df_name': 'dataframe_1'}],
        [TEST_DF_5.iloc[:, :3]],
    ),
    # we have a bottom left corner value as well as a number of empty rowsof columns
    (
        ['A1:E3'],
        [TEST_DF_5],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_5.columns[0]}, 'end_condition': {'type': 'bottom left corner value', 'value': 'abc'}, 'column_end_condition': {'type': 'num columns', 'value': 3}, 'df_name': 'dataframe_1'}],
        [TEST_DF_5.iloc[:1, :3]],
    ),
    # Can't go where there are no data in the rows, so we put some fake data in J3
    (
        ['A1:E3', 'J3:K4'],
        [TEST_DF_5, TEST_DF_1],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_5.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'num columns', 'value': 10}, 'df_name': 'dataframe_1'}],
        [pd.concat([TEST_DF_5, pd.DataFrame([[np.nan if i != 4 or j != 1 else "header 1" for i in range(5)] for j in range(2)], columns=['Unnamed: 5', 'Unnamed: 6', 'Unnamed: 7', 'Unnamed: 8', 'Unnamed: 9'])], axis=1)],
    ),
    # Test start condition starts with condition
    (
        ['A1:B2'],
        [TEST_DF_4],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value starts with', 'value': 'header'}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_4],
    ),  
    # Test start condition contains with condition
    (
        ['A1:B2'],
        [TEST_DF_4],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value contains', 'value': 'er 10'}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_4],
    ),  
    # Test end condition starts with condition
    (
        ['A1:B4'],
        [TEST_DF_3],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_3.columns[0]}, 'end_condition': {'type': 'bottom left corner value starts with', 'value': 20}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_3.iloc[0:2]],
    ),
    # Test end condition starts with condition not starting from A1
    (
        ['B2:C5'],
        [TEST_DF_3],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_3.columns[0]}, 'end_condition': {'type': 'bottom left corner value starts with', 'value': 20}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_3.iloc[0:2]],
    ),
    # Test end condition contains
    (
        ['A1:B4'],
        [TEST_DF_3],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_3.columns[0]}, 'end_condition': {'type': 'bottom left corner value contains', 'value': 20}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_3.iloc[0:2]],
    ),
    # Test end condition contains
    (
        ['B2:C5'],
        [TEST_DF_3],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_3.columns[0]}, 'end_condition': {'type': 'bottom left corner value contains', 'value': 20}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_3.iloc[0:2]],
    ),
    # Tests start with and end with conditions
    (
        ['A1:B2'],
        [TEST_DF_4],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value contains', 'value': 'er 10'}, 'end_condition': {'type': 'bottom left corner value contains', 'value': 'abc'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_4.iloc[0:1]],
    ),  
    # Tests start with and end with conditions, and has a number of columns
    (
        ['A1:B2'],
        [TEST_DF_4],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value contains', 'value': 'er 10'}, 'end_condition': {'type': 'bottom left corner value contains', 'value': 'abc'}, 'column_end_condition': {'type': 'num columns', 'value': 2}, 'df_name': 'dataframe_1'}],
        [TEST_DF_4.iloc[0:1][TEST_DF_4.columns[0:2]]],
    ),  
    # Test that starts with or contains works when there is a gap of Nones, and we don't detect this as the upper left corner value
    (
        ['A1:B2', 'A4:B5'],
        [TEST_DF_1, TEST_DF_2],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value contains', 'value': 'er 10'}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_2],
    ),  
    # Tests bottom left corner consecutive emtpy cells
    (
        ['A1:D5'],
        [TEST_DF_7],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value contains', 'value': 'A'}, 'end_condition': {'type': 'bottom left corner consecutive empty cells', 'value': 3}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_7.iloc[0:3]],
    ), 
    # Tests bottom left corner consecutive emtpy cells
    (
        ['A2:D6', 'G1:J5'],
        [TEST_DF_7, TEST_DF_7],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value contains', 'value': 'A'}, 'end_condition': {'type': 'bottom left corner consecutive empty cells', 'value': 3}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_7.iloc[0:3]],
    ), 
    # Tests row entirely empty
    (
        ['A2:D6'],
        [TEST_DF_7],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value contains', 'value': 'A'}, 'end_condition': {'type': 'row entirely empty'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_7],
    ), 
    # Tests number of entirely empty rows with one skip
    (
        ['A1:B2', 'A4:B5'],
        [TEST_DF_1, TEST_DF_1],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 'header 1'}, 'end_condition': {'type': 'cumulative number of empty rows', 'value': 2}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [pd.DataFrame({'header 1': [1, None, 'header 1', 1], 'header 2': [2, None, 'header 2', 2]})],
    ), 
    # Tests number of entirely empty rows with two skips
    (
        ['A1:B2', 'A5:B6'],
        [TEST_DF_1, TEST_DF_1],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 'header 1'}, 'end_condition': {'type': 'cumulative number of empty rows', 'value': 3}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [pd.DataFrame({'header 1': [1, None, None, 'header 1', 1], 'header 2': [2, None, None, 'header 2', 2]})],
    ), 
    # Tests number of entirely empty rows hits the end of the sheet
    (
        ['A1:B2'],
        [TEST_DF_1],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 'header 1'}, 'end_condition': {'type': 'cumulative number of empty rows', 'value': 10}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_1],
    ), 
    # Doesn't check starting cell for contains, and skips NaN values if the bottom left corner value is in the import code
    (
        ['A1:A3'],
        [TEST_DF_8],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value contains', 'value': 'A'}, 'end_condition': {'type': 'bottom left corner value contains', 'value': 'A'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_8],
    ), 
    # Number of consecutive empty cells in a column
    (
        ['A1:A3', 'A6:A8'],
        [TEST_DF_8, TEST_DF_8],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value contains', 'value': 'A'}, 'end_condition': {'type': 'bottom left corner consecutive empty cells in first column', 'value': 2}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_8],
    ), 
    # Number of consecutive empty cells in a column end of sheet
    (
        ['A1:A3'],
        [TEST_DF_8],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value contains', 'value': 'A'}, 'end_condition': {'type': 'bottom left corner consecutive empty cells in first column', 'value': 2}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_8],
    ),
    # Tests number of entirely empty rows with one skip, which is triggered
    (
        ['A1:B2'],
        [TEST_DF_1],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 'header 1'}, 'end_condition': {'type': 'cumulative number of empty rows', 'value': 2}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}],
        [TEST_DF_1],
    ), 
    # Tests number of entirely empty rows executes after column end condition is found
    (
        ['A1:B2'],
        [TEST_DF_7],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 'A'}, 'end_condition': {'type': 'cumulative number of empty rows', 'value': 2}, 'column_end_condition': {'type': 'num columns', 'value': 2}, 'df_name': 'dataframe_1'}],
        [TEST_DF_7.iloc[0:3, 0:2]],
    ), 
    # Tests number of consecutive empty rows
    (
        ['A1:B2', 'A4:B5'],
        [TEST_DF_1, TEST_DF_1],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 'header 1'}, 'end_condition': {'type': 'consecutive number of empty rows', 'value': 2}, 'column_end_condition': {'type': 'num columns', 'value': 2}, 'df_name': 'dataframe_1'}],
        [pd.DataFrame({'header 1': [1, np.nan, 'header 1', 1], 'header 2': [2, np.nan, 'header 2', 2]})],
    ), 
    # Test number of consecutive empty rows, with partially filled row
    (
        ['A1:B2', 'A4:B5', 'B7:C8'],
        [TEST_DF_1, TEST_DF_1, TEST_DF_1],
        [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 'header 1'}, 'end_condition': {'type': 'consecutive number of empty rows', 'value': 2}, 'column_end_condition': {'type': 'num columns', 'value': 2}, 'df_name': 'dataframe_1'}],
        [pd.DataFrame({'header 1': [1, None, 'header 1', 1, None, None, None], 'header 2': [2, None, 'header 2', 2, None, 'header 1', 1]})],
    )

    
]
@pandas_post_1_2_only
@python_post_3_6_only
@pytest.mark.parametrize("range, input_dfs, imports, output_dfs", EXCEL_RANGE_IMPORT_TESTS)
def test_excel_range_import(range, input_dfs, imports, output_dfs):

    # Write an Excel file
    with pd.ExcelWriter(TEST_FILE_PATH) as writer:
        for index, _range in enumerate(range):
            ((startcol, startrow), _) = get_col_and_row_indexes_from_range(_range)
            input_dfs[index].to_excel(writer, sheet_name=TEST_SHEET_NAME, startrow=startrow, startcol=startcol, index=False)  

    mito = create_mito_wrapper()

    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet name', 'value': TEST_SHEET_NAME}, imports, False)

    assert len(mito.dfs) == len(imports)
    for actual, expected in zip(mito.dfs, output_dfs):
        print(actual)
        print(expected)
        assert actual.equals(expected)

    os.remove(TEST_FILE_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_excel_range_import_works_on_public_interface_1():

    # Write an Excel file
    with pd.ExcelWriter(TEST_FILE_PATH) as writer:
        ((startcol, startrow), _) = get_col_and_row_indexes_from_range('A1:B2')
        pd.DataFrame({'A': [1], "B": [2]}).to_excel(writer, sheet_name=TEST_SHEET_NAME, startrow=startrow, startcol=startcol, index=False)  

    mito = create_mito_wrapper()
    mito.mito_backend.steps_manager.public_interface_version = 1

    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet name', 'value': TEST_SHEET_NAME}, [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 'A'}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1'}], False)

    assert len(mito.dfs) == 1
    for actual, expected in zip(mito.dfs, [pd.DataFrame({'A': [1], "B": [2]})]):
        assert actual.equals(expected)

    os.remove(TEST_FILE_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_import_with_defined_name_works():
    mito = create_mito_wrapper(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)

    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet name', 'value': TEST_SHEET_NAME}, [{'type': 'range', 'df_name': 'df1', 'value': 'A1:B2'}], False)

    assert len(mito.dfs) == 2
    assert TEST_DF_1.equals(mito.dfs[0])
    assert TEST_DF_2.equals(mito.dfs[1])

    # Make sure all names are unique
    assert len(set(mito.df_names)) == len(mito.df_names)

    os.remove(TEST_FILE_PATH)

INVALID_RANGES = [
    'A',
    'A:C'
]
@pandas_post_1_2_only
@python_post_3_6_only
@pytest.mark.parametrize("r", INVALID_RANGES)
def test_invalid_ranges_error(r):
    with pytest.raises(MitoError) as e_info:
        get_col_and_row_indexes_from_range(r)

    assert 'Invalid Range' in str(e_info) 



EXCEL_UPPER_LEFT_CORNER_DETECTION_TESTS = [
    (
        ['A1:B2'],
        [TEST_DF_1]
    ),
    (
        ['A1:E3'],
        [TEST_DF_5]
    ),
    (
        ['AA100:AB101'],
        [TEST_DF_1]
    ),
    (
        ['A1:B4'],
        [TEST_DF_3]
    ),
    (
        ['A1:B3'],
        [TEST_DF_4]
    ),
    # Test two, seperated by a row
    (
        ['A1:B2', 'A4:B5'],
        [TEST_DF_1, TEST_DF_2]
    ),
    # Test two, seperated by a col
    (
        ['A1:B2', 'D1:E2'],
        [TEST_DF_1, TEST_DF_2]
    ),
    # Test two, seperated by a row and col
    (
        ['A1:B2', 'D4:E5'],
        [TEST_DF_1, TEST_DF_2]
    ),
]
@pandas_post_1_2_only
@python_post_3_6_only
@pytest.mark.parametrize("ranges, dfs", EXCEL_UPPER_LEFT_CORNER_DETECTION_TESTS)
def test_excel_range_upper_left_detection_works(ranges, dfs):

    # Write an Excel file
    with pd.ExcelWriter(TEST_FILE_PATH) as writer:
        for r, df in zip(ranges, dfs):
            ((startcol, startrow), _) = get_col_and_row_indexes_from_range(r)
            df.to_excel(writer, sheet_name=TEST_SHEET_NAME, startrow=startrow, startcol=startcol, index=False)  

    for r, df in zip(ranges, dfs):
        upper_left_value = df.columns[0]
        assert r == get_table_range(TEST_FILE_PATH, TEST_SHEET_NAME, upper_left_value)

    os.remove(TEST_FILE_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
@pytest.mark.parametrize("ranges, dfs", EXCEL_UPPER_LEFT_CORNER_DETECTION_TESTS)
def test_excel_range_upper_left_with_end_condition(ranges, dfs):

    # Write an Excel file
    with pd.ExcelWriter(TEST_FILE_PATH) as writer:
        for r, df in zip(ranges, dfs):
            ((startcol, startrow), _) = get_col_and_row_indexes_from_range(r)
            df.to_excel(writer, sheet_name=TEST_SHEET_NAME, startrow=startrow, startcol=startcol, index=False)  

    for r, df in zip(ranges, dfs):
        upper_left_value = df.columns[0]
        column = df[upper_left_value]
        ((start_col_index, start_row_index), (end_col_index, end_row_index)) = get_col_and_row_indexes_from_range(r)
        for idx, value in enumerate(column):
            recovered_range = get_table_range(TEST_FILE_PATH, TEST_SHEET_NAME, upper_left_value, bottom_left_value=value)
            ((start_col_index_recovered, start_row_index_recovered), (end_col_index_recovered, end_row_index_recovered)) = get_col_and_row_indexes_from_range(recovered_range)
            assert start_col_index == start_col_index_recovered
            assert end_col_index == end_col_index_recovered
            assert start_row_index == start_row_index_recovered
            assert end_row_index == end_row_index_recovered + (len(df) - idx) - 1

    os.remove(TEST_FILE_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_excel_range_upper_left_detection_finds_first_match():
    ranges = ['A1:B4']
    dfs = [TEST_DF_6]

    # Write an Excel file
    with pd.ExcelWriter(TEST_FILE_PATH) as writer:
        for r, df in zip(ranges, dfs):
            ((startcol, startrow), _) = get_col_and_row_indexes_from_range(r)
            df.to_excel(writer, sheet_name=TEST_SHEET_NAME, startrow=startrow, startcol=startcol, index=False)

    mito = create_mito_wrapper()
    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet name', 'value': TEST_SHEET_NAME}, [{'type': 'dynamic', 'start_condition': {'type': 'upper left corner value', 'value': 1}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'df1'}], False)

    assert mito.dfs[0].equals(TEST_DF_6)


@pandas_post_1_2_only
@python_post_3_6_only
def test_excel_range_import_followed_by_rename_other_does_not_optimize():
    mito = create_mito_wrapper(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)

    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet name', 'value': TEST_SHEET_NAME}, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}], False)
    mito.rename_dataframe(0, 'new_df1')

    assert len(mito.dfs) == 2
    assert TEST_DF_1.equals(mito.dfs[0])
    assert TEST_DF_2.equals(mito.dfs[1])

    assert mito.df_names[0] == 'new_df1'
    assert len(mito.optimized_code_chunks) == 2

    os.remove(TEST_FILE_PATH)


@pandas_post_1_2_only
@python_post_3_6_only
def test_excel_range_import_followed_by_delete_optimizes():
    mito = create_mito_wrapper(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)

    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet name', 'value': TEST_SHEET_NAME}, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}], False)
    mito.delete_dataframe(1)

    assert len(mito.dfs) == 1
    assert TEST_DF_1.equals(mito.dfs[0])

    assert len(mito.transpiled_code) == 0
    os.remove(TEST_FILE_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_excel_range_import_followed_by_delete_other_does_not_optimize():
    mito = create_mito_wrapper(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)

    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet name', 'value': TEST_SHEET_NAME}, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}], False)
    mito.delete_dataframe(0)

    assert len(mito.dfs) == 1
    assert TEST_DF_2.equals(mito.dfs[0])

    assert len(mito.transpiled_code) >= 0
    os.remove(TEST_FILE_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_two_excel_range_imports_optimize_together():
    mito = create_mito_wrapper(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)

    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet name', 'value': TEST_SHEET_NAME}, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}], False)
    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet name', 'value': TEST_SHEET_NAME}, [{'type': 'range', 'df_name': 'df3', 'value': 'A1:B2'}], False)

    assert len(mito.dfs) == 3
    assert TEST_DF_1.equals(mito.dfs[0])
    assert TEST_DF_2.equals(mito.dfs[1])
    assert TEST_DF_2.equals(mito.dfs[2])

    assert len(mito.optimized_code_chunks) == 1
    os.remove(TEST_FILE_PATH)


@pandas_post_1_2_only
@python_post_3_6_only
def test_two_excel_range_imports_different_sheet_do_not_optimize_together():
    mito = create_mito_wrapper(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)
    TEST_DF_2.to_excel(TEST_FILE_PATH_2, sheet_name=TEST_SHEET_NAME_2, index=False)

    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet name', 'value': TEST_SHEET_NAME}, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}], False)
    mito.excel_range_import(TEST_FILE_PATH_2, {'type': 'sheet name', 'value': TEST_SHEET_NAME_2}, [{'type': 'range', 'df_name': 'df3', 'value': 'A1:B2'}], False)

    assert len(mito.dfs) == 3
    assert TEST_DF_1.equals(mito.dfs[0])
    assert TEST_DF_2.equals(mito.dfs[1])
    assert TEST_DF_2.equals(mito.dfs[2])

    assert len(mito.optimized_code_chunks) == 2
    os.remove(TEST_FILE_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_convert_csv_to_excel_before_importing():
    mito = create_mito_wrapper()
    TEST_DF_2.to_csv(TEST_FILE_CSV_PATH, index=False)

    mito.excel_range_import(TEST_FILE_CSV_PATH, {'type': 'sheet name', 'value': TEST_SHEET_NAME}, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}], True)

    assert len(mito.dfs) == 1
    assert TEST_DF_2.equals(mito.dfs[0])

    os.remove(TEST_FILE_CSV_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_convert_csv_to_excel_multiple_ranges_same_number_of_columns():
    mito = create_mito_wrapper()

    # Write two CSVS to the same file
    TEST_DF_1.to_csv(TEST_FILE_CSV_PATH, index=False)
    TEST_DF_2.to_csv(TEST_FILE_CSV_PATH, mode='a', index=False, header=True)

    mito.excel_range_import(
        TEST_FILE_CSV_PATH, 
        {'type': 'sheet name', 'value': TEST_SHEET_NAME}, 
        [
            # NOTE: You need to pass '1' in the ending value, as it gets read in as a string, as the second set of headers lead to it being a string column
            {'type': 'dynamic', 'df_name': 'df1', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_1.columns[0]}, 'end_condition': {'type': 'bottom left corner value', 'value': '1'}, 'column_end_condition': {'type': 'first empty cell'}},
            {'type': 'dynamic', 'df_name': 'df2', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_2.columns[0]}, 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}}
        ], True)

    assert len(mito.dfs) == 2
    print(mito.dfs[0])
    assert TEST_DF_1.equals(mito.dfs[0])
    assert TEST_DF_2.equals(mito.dfs[1])

    os.remove(TEST_FILE_CSV_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_convert_csv_to_excel_multiple_ranges_grows_in_columns():
    mito = create_mito_wrapper()

    # Write two CSVS to the same file
    TEST_DF_1.to_csv(TEST_FILE_CSV_PATH, index=False)
    TEST_DF_5.to_csv(TEST_FILE_CSV_PATH, mode='a', index=False, header=True)
    TEST_DF_2.to_csv(TEST_FILE_CSV_PATH, mode='a', index=False, header=True)

    mito.excel_range_import(
        TEST_FILE_CSV_PATH, 
        {'type': 'sheet name', 'value': TEST_SHEET_NAME}, 
        [
            # NOTE: You need to pass '1' in the ending value, as it gets read in as a string, as the second set of headers lead to it being a string column
            {'type': 'dynamic', 'df_name': 'df1', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_1.columns[0]}, 'end_condition': {'type': 'bottom left corner value', 'value': '1'}, 'column_end_condition': {'type': 'first empty cell'}},
            {'type': 'dynamic', 'df_name': 'df2', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_5.columns[0]}, 'end_condition': {'type': 'bottom left corner value', 'value': 'def'}, 'column_end_condition': {'type': 'first empty cell'}},
            {'type': 'dynamic', 'df_name': 'df3', 'start_condition': {'type': 'upper left corner value', 'value': TEST_DF_2.columns[0]}, 'end_condition': {'type': 'bottom left corner value', 'value': '3'}, 'column_end_condition': {'type': 'first empty cell'}},
        ], True)

    assert len(mito.dfs) == 3
    assert TEST_DF_1.equals(mito.dfs[0])
    assert TEST_DF_5.equals(mito.dfs[1])
    assert TEST_DF_2.equals(mito.dfs[2])

    os.remove(TEST_FILE_CSV_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_excel_range_import_sheet_index():
    # Use ExcelWriter to write two sheets
    with pd.ExcelWriter(TEST_FILE_PATH) as writer:
        TEST_DF_1.to_excel(writer, sheet_name=TEST_SHEET_NAME, index=False)
        TEST_DF_2.to_excel(writer, sheet_name=TEST_SHEET_NAME_2, index=False)
    
    mito = create_mito_wrapper()

    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet index', 'value': 0}, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}], False)
    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet index', 'value': 1}, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}], False)
    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet index', 'value': -1}, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}], False)
    mito.excel_range_import(TEST_FILE_PATH, {'type': 'sheet index', 'value': -2}, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}], False)

    assert len(mito.dfs) == 4
    assert TEST_DF_1.equals(mito.dfs[0])
    assert TEST_DF_2.equals(mito.dfs[1])
    assert TEST_DF_2.equals(mito.dfs[2])
    assert TEST_DF_1.equals(mito.dfs[3])

@pandas_post_1_2_only
@python_post_3_6_only
def test_excel_range_import_can_add_multiple_end_conditions_no_error():
    # Use ExcelWriter to write two sheets
    with pd.ExcelWriter(TEST_FILE_PATH) as writer:
        TEST_DF_8.to_excel(writer, index=False)
    
    from mitosheet.public.v3 import get_table_range

    range1 = get_table_range(TEST_FILE_PATH, sheet_index=0, upper_left_value='A', bottom_left_value='B', bottom_left_consecutive_empty_cells_in_first_column=2)
    range2 = get_table_range(TEST_FILE_PATH, sheet_index=0, upper_left_value='A', bottom_left_value='A', bottom_left_consecutive_empty_cells_in_first_column=2)
    range3 = get_table_range(TEST_FILE_PATH, sheet_index=0, upper_left_value='A', bottom_left_value='A', bottom_left_consecutive_empty_cells_in_first_column=3)
    assert range1 == 'A1:A3'
    assert range2 == 'A1:A3'
    assert range3 == 'A1:A3'

