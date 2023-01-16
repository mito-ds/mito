#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Excel Range Import
"""

import os

import pandas as pd
import pytest

from mitosheet.errors import MitoError
from mitosheet.excel_utils import get_col_and_row_indexes_from_range, get_table_range_from_upper_left_corner_value
from mitosheet.tests.decorators import (pandas_post_1_2_only,
                                        python_post_3_6_only)
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

TEST_FILE_PATH = "test_file.xlsx"
TEST_SHEET_NAME = 'sheet1'
TEST_DF_1 = pd.DataFrame({'header 1': [1], 'header 2': [2]})
TEST_DF_2 = pd.DataFrame({'header 100': [3], 'header 200': [4]})
TEST_DF_3 = pd.DataFrame({'header 101': [100, 200, 300], 'header 201': [200, 300, 400]})
TEST_DF_4 = pd.DataFrame({'header 102': ['abc', 'def'], 'header 202': ['hig', 'jkl']})
TEST_DF_5 = pd.DataFrame({'A': ['abc', 'def'], 'B': ['abc', 'def'], 'C': ['abc', 'dev'], 'D': ['abc', 'dev'], 'E': ['abc', 'dev'], })


EXCEL_RANGE_IMPORT_TESTS = [
    (
        ['A1:B2'],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'A1:B2'}],
        [TEST_DF_1]
    ),
    (
        ['A1:B2'],
        [{'type': 'upper left corner value', 'df_name': 'dataframe_1', 'value': TEST_DF_1.columns[0]}],
        [TEST_DF_1]
    ),
    (   
        ['AA100:AB101'],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'AA100:AB101'}],
        [TEST_DF_1]
    ),
    (
        ['AA100:AB101'],
        [{'type': 'upper left corner value', 'df_name': 'dataframe_1', 'value': TEST_DF_1.columns[0]}],
        [TEST_DF_1]
    ),
    (
        ['A1:E3'],
        [{'type': 'upper left corner value', 'df_name': 'dataframe_1', 'value': TEST_DF_5.columns[0]}],
        [TEST_DF_5]
    ),
    (
        ['A1:G100'],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'A1:G100'}],
        [TEST_DF_1]
    ),
    (
        ['A1:G100'],
        [{'type': 'upper left corner value', 'df_name': 'dataframe_1', 'value': TEST_DF_1.columns[0]}],
        [TEST_DF_1]
    ),
    (   
        ['B2:A1'],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'B2:A1'}],
        [TEST_DF_1]
    ),
    (
        ['A1:B4'],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'A1:B4'}],
        [TEST_DF_3]
    ),
    (
        ['A1:B4'],
        [{'type': 'upper left corner value', 'df_name': 'dataframe_1', 'value': TEST_DF_3.columns[0]}],
        [TEST_DF_3]
    ),
    (
        ['A1:B2', 'A4:B5'],
        [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'A1:B2'}, {'type': 'range', 'df_name': 'dataframe_2',  'value': 'A4:B5'}],
        [TEST_DF_1, TEST_DF_2]
    ),
    (
        ['A1:B2', 'A4:B5'],
        [{'type': 'upper left corner value', 'df_name': 'dataframe_1', 'value': TEST_DF_1.columns[0]}, {'type': 'upper left corner value', 'df_name': 'dataframe_2', 'value': TEST_DF_2.columns[0]}],
        [TEST_DF_1, TEST_DF_2]
    ),
    (
        ['A1:B2', 'A4:B5'],
        [{'type': 'upper left corner value', 'df_name': 'dataframe_1', 'value': TEST_DF_1.columns[0]}, {'type': 'range', 'df_name': 'dataframe_2',  'value': 'A4:B5'}],
        [TEST_DF_1, TEST_DF_2]
    ),
    (
        ['A1:B2', 'A4:B5'],
        [{'type': 'upper left corner value', 'df_name': 'a bad dataframe name', 'value': TEST_DF_1.columns[0]}, {'type': 'range', 'df_name': '97 also bad', 'value': 'A4:B5'}],
        [TEST_DF_1, TEST_DF_2]
    ),
    (
        ['A1:B2', 'A4:B5'],
        [{'type': 'range', 'df_name': 'a bad dataframe name', 'value': 'A1:B2'}, {'type': 'range', 'df_name': '97 also bad', 'value': 'A4:B5'}],
        [TEST_DF_1, TEST_DF_2]
    ),
]
@pandas_post_1_2_only
@python_post_3_6_only
@pytest.mark.parametrize("range, imports, dfs", EXCEL_RANGE_IMPORT_TESTS)
def test_excel_range_import(range, imports, dfs):

    # Write an Excel file
    with pd.ExcelWriter(TEST_FILE_PATH) as writer:
        for index, _range in enumerate(range):
            ((startcol, startrow), _) = get_col_and_row_indexes_from_range(_range)
            dfs[index].to_excel(writer, sheet_name=TEST_SHEET_NAME, startrow=startrow, startcol=startcol, index=False)  

    mito = create_mito_wrapper_dfs()

    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, imports)

    assert len(mito.dfs) == len(imports)
    for actual, expected in zip(mito.dfs, dfs):
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