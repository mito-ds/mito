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
from mitosheet.public.v2 import get_table_range_from_upper_left_corner_value
from mitosheet.tests.decorators import (pandas_post_1_2_only,
                                        python_post_3_6_only)
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

TEST_FILE_PATH = "test_file.xlsx"
TEST_SHEET_NAME = 'sheet1'
TEST_FILE_PATH_2 = "test_file2.xlsx"
TEST_SHEET_NAME_2 = 'sheet2'
TEST_DF_1 = pd.DataFrame({'header 1': [1], 'header 2': [2]})
TEST_DF_2 = pd.DataFrame({'header 100': [3], 'header 200': [4]})
TEST_DF_3 = pd.DataFrame({'header 101': [100, 200, 300], 'header 201': [200, 300, 400]})
TEST_DF_4 = pd.DataFrame({'header 102': ['abc', 'def'], 'header 202': ['hig', 'jkl']})
TEST_DF_5 = pd.DataFrame({'A': ['abc', 'def'], 'B': ['abc', 'def'], 'C': ['abc', 'dev'], 'D': ['abc', 'dev'], 'E': ['abc', 'dev'], })
TEST_DF_6 = pd.DataFrame({1: [1, 1, 1], 2: [2, 2, 2]})


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
        [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1', 'value': TEST_DF_1.columns[0]}],
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
        [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1', 'value': TEST_DF_1.columns[0]}],
        [TEST_DF_1],
    ),
    (
        ['A1:E3'],
        [TEST_DF_5],
        [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1', 'value': TEST_DF_5.columns[0]}],
        [TEST_DF_5],
    ),
    (
        ['A1:G100'],
        [TEST_DF_1],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'A1:G100'}],
        [TEST_DF_1],
    ),
    (
        ['A1:G100'],
        [TEST_DF_1],
        [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1', 'value': TEST_DF_1.columns[0]}],
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
        [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1', 'value': TEST_DF_3.columns[0]}],
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
        [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1', 'value': TEST_DF_1.columns[0]}, {'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_2', 'value': TEST_DF_2.columns[0]}],
        [TEST_DF_1, TEST_DF_2],
    ),
    (
        ['A1:B2', 'A4:B5'],
        [TEST_DF_1, TEST_DF_2],
        [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1', 'value': TEST_DF_1.columns[0]}, {'type': 'range', 'df_name': 'dataframe_2',  'value': 'A4:B5'}],
        [TEST_DF_1, TEST_DF_2],
    ),
    (
        ['A1:B2', 'A4:B5'],
        [TEST_DF_1, TEST_DF_2],
        [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'a bad dataframe name', 'value': TEST_DF_1.columns[0]}, {'type': 'range', 'df_name': '97 also bad', 'value': 'A4:B5'}],
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
        [{'type': 'upper left corner value', 'end_condition': {'type': 'bottom left corner value', 'value': 200}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1', 'value': TEST_DF_3.columns[0]}],
        [TEST_DF_3.iloc[0:2]],
    ),
    # Have a NaN value in the middle
    (
        ['A1:B2', 'A4:B5'],
        [pd.DataFrame({'A': [1]}), pd.DataFrame({'B': [100]})],
        [{'type': 'upper left corner value', 'end_condition': {'type': 'bottom left corner value', 'value': 100}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1', 'value': 'A'}],
        [pd.DataFrame({'A': [1, None, 'B', 100]})],
    ),
    # End on a string
    (
        ['A1:B2', 'A4:B5'],
        [pd.DataFrame({'A': [1]}), pd.DataFrame({'B': [100]})],
        [{'type': 'upper left corner value', 'end_condition': {'type': 'bottom left corner value', 'value': 'B'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1', 'value': 'A'}],
        [pd.DataFrame({'A': [1, None, 'B']})],
    ),
    # Have empty cells in the final row
    (
        ['A1:B2', 'A4:B5'],
        [pd.DataFrame({'A': [1], 'D': [1]}), pd.DataFrame({'B': [100], 'C': [None]})],
        [{'type': 'upper left corner value', 'end_condition': {'type': 'bottom left corner value', 'value': 'B'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'dataframe_1', 'value': 'A'}],
        [pd.DataFrame({'A': [1, None, 'B'], 'D': [1, None, 'C']})],
    ),
    (
        ['A1:E3'],
        [TEST_DF_5],
        [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'num columns', 'value': 1}, 'df_name': 'dataframe_1', 'value': TEST_DF_5.columns[0]}],
        [TEST_DF_5.iloc[:, :1]],
    ),
    (
        ['A1:E3'],
        [TEST_DF_5],
        [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'num columns', 'value': 3}, 'df_name': 'dataframe_1', 'value': TEST_DF_5.columns[0]}],
        [TEST_DF_5.iloc[:, :3]],
    ),
    # Can't go where there are no data in the rows, so we put some fake data in J3
    (
        ['A1:E3', 'J3:K4'],
        [TEST_DF_5, TEST_DF_1],
        [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'num columns', 'value': 10}, 'df_name': 'dataframe_1', 'value': TEST_DF_5.columns[0]}],
        [pd.concat([TEST_DF_5, pd.DataFrame([[np.nan if i != 4 or j != 1 else "header 1" for i in range(5)] for j in range(2)], columns=['Unnamed: 5', 'Unnamed: 6', 'Unnamed: 7', 'Unnamed: 8', 'Unnamed: 9'])], axis=1)],
    ),
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

    mito = create_mito_wrapper_dfs()

    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, imports)

    assert len(mito.dfs) == len(imports)
    for actual, expected in zip(mito.dfs, output_dfs):
        print(actual)
        print(expected)
        assert actual.equals(expected)

    os.remove(TEST_FILE_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_import_with_defined_name_works():
    mito = create_mito_wrapper_dfs(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)

    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, [{'type': 'range', 'df_name': 'df1', 'value': 'A1:B2'}])

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
        assert r == get_table_range_from_upper_left_corner_value(TEST_FILE_PATH, TEST_SHEET_NAME, upper_left_value)

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
            recovered_range = get_table_range_from_upper_left_corner_value(TEST_FILE_PATH, TEST_SHEET_NAME, upper_left_value, bottom_left_value=value)
            print(r, recovered_range)
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

    mito = create_mito_wrapper_dfs()
    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, [{'type': 'upper left corner value', 'end_condition': {'type': 'first empty cell'}, 'column_end_condition': {'type': 'first empty cell'}, 'df_name': 'df1', 'value': 1}])

    assert mito.dfs[0].equals(TEST_DF_6)


@pandas_post_1_2_only
@python_post_3_6_only
def test_excel_range_import_followed_by_rename_other_does_not_optimize():
    mito = create_mito_wrapper_dfs(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)

    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}])
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
    mito = create_mito_wrapper_dfs(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)

    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}])
    mito.delete_dataframe(1)

    assert len(mito.dfs) == 1
    assert TEST_DF_1.equals(mito.dfs[0])

    assert len(mito.transpiled_code) == 0
    os.remove(TEST_FILE_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_excel_range_import_followed_by_delete_other_does_not_optimize():
    mito = create_mito_wrapper_dfs(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)

    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}])
    mito.delete_dataframe(0)

    assert len(mito.dfs) == 1
    assert TEST_DF_2.equals(mito.dfs[0])

    assert len(mito.transpiled_code) >= 0
    os.remove(TEST_FILE_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_two_excel_range_imports_optimize_together():
    mito = create_mito_wrapper_dfs(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)

    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}])
    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, [{'type': 'range', 'df_name': 'df3', 'value': 'A1:B2'}])

    assert len(mito.dfs) == 3
    assert TEST_DF_1.equals(mito.dfs[0])
    assert TEST_DF_2.equals(mito.dfs[1])
    assert TEST_DF_2.equals(mito.dfs[2])

    assert len(mito.optimized_code_chunks) == 1
    os.remove(TEST_FILE_PATH)


@pandas_post_1_2_only
@python_post_3_6_only
def test_two_excel_range_imports_different_sheet_do_not_optimize_together():
    mito = create_mito_wrapper_dfs(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)
    TEST_DF_2.to_excel(TEST_FILE_PATH_2, sheet_name=TEST_SHEET_NAME_2, index=False)

    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, [{'type': 'range', 'df_name': 'df2', 'value': 'A1:B2'}])
    mito.excel_range_import(TEST_FILE_PATH_2, TEST_SHEET_NAME_2, [{'type': 'range', 'df_name': 'df3', 'value': 'A1:B2'}])

    assert len(mito.dfs) == 3
    assert TEST_DF_1.equals(mito.dfs[0])
    assert TEST_DF_2.equals(mito.dfs[1])
    assert TEST_DF_2.equals(mito.dfs[2])

    assert len(mito.optimized_code_chunks) == 2
    os.remove(TEST_FILE_PATH)