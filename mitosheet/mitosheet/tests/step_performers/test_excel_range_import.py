#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Excel Range Import
"""

import os

import pandas
import pandas as pd
import pytest
from openpyxl import load_workbook

from mitosheet.errors import MitoError
from mitosheet.excel_utils import get_row_and_col_indexes_from_range
from mitosheet.tests.decorators import (pandas_post_1_2_only,
                                        python_post_3_6_only)
from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.utils import get_new_id

TEST_FILE_PATH = "test_file.xlsx"
TEST_SHEET_NAME = 'sheet1'
TEST_DF_1 = pd.DataFrame({'header 1': [1], 'header 2': [2]})
TEST_DF_2 = pd.DataFrame({'header 100': [1], 'header 200': [2]})
TEST_DF_3 = pd.DataFrame({'header 100': [100, 200, 300], 'header 200': [200, 300, 400]})


def write_df_to_file(file_path: str, sheet_name: str, df: pd.DataFrame, range: str) -> None:

    if os.path.exists(file_path):

        book = load_workbook(file_path)
        writer = pandas.ExcelWriter(file_path, engine='openpyxl') 
        writer.book = book

        ## ExcelWriter for some reason uses writer.sheets to access the sheet.
        ## If you leave it empty it will not know that sheet Main is already there
        ## and will create a new sheet.

        #writer.sheets = dict((ws.title, ws) for ws in book.worksheets)

        df.to_excel(writer, sheet_name=sheet_name, startrow=startrow, startcol=startcol, index=False)  

        writer.close()
    else:
        # Write an Excel file
        with pd.ExcelWriter(file_path) as writer:
            df.to_excel(writer, sheet_name=sheet_name, startrow=startrow, startcol=startcol, index=False)  


EXCEL_RANGE_IMPORT_TESTS = [
    (
        [{'type': 'range', 'df_name': 'dataframe_1', 'range': 'A1:B2'}],
        [TEST_DF_1]
    ),
    (
        [{'type': 'range', 'df_name': 'dataframe_1', 'range': 'AA100:AB101'}],
        [TEST_DF_1]
    ),
    (
        [{'type': 'range', 'df_name': 'dataframe_1', 'range': 'A1:G100'}],
        [TEST_DF_1]
    ),
    (
        [{'type': 'range', 'df_name': 'dataframe_1', 'range': 'B2:A1'}],
        [TEST_DF_1]
    ),
    (
        [{'type': 'range', 'df_name': 'dataframe_1', 'range': 'A1:B4'}],
        [TEST_DF_3]
    ),
    (
        [{'type': 'range', 'df_name': 'dataframe_1', 'range': 'A1:B2'}, {'type': 'range', 'df_name': 'dataframe_2',  'range': 'A4:B5'}],
        [TEST_DF_1, TEST_DF_2]
    ),
    (
        [{'type': 'range', 'df_name': 'a bad dataframe name', 'range': 'A1:B2'}, {'type': 'range', 'df_name': '97 also bad', 'range': 'A4:B5'}],
        [TEST_DF_1, TEST_DF_2]
    ),
]
@pandas_post_1_2_only
@python_post_3_6_only
@pytest.mark.parametrize("imports, dfs", EXCEL_RANGE_IMPORT_TESTS)
def test_excel_range_import(imports, dfs):

    # Write an Excel file
    with pd.ExcelWriter(TEST_FILE_PATH) as writer:
        for index, range_import in enumerate(imports):
            ((startcol, startrow), _) = get_row_and_col_indexes_from_range(range_import['range'])
            dfs[index].to_excel(writer, sheet_name=TEST_SHEET_NAME, startrow=startrow, startcol=startcol, index=False)  

    mito = create_mito_wrapper_dfs()

    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, imports)

    assert len(mito.dfs) == len(imports)
    for actual, expected in zip(mito.dfs, dfs):
        assert actual.equals(expected)

    os.remove(TEST_FILE_PATH)

@pandas_post_1_2_only
@python_post_3_6_only
def test_import_with_defined_name_works():
    mito = create_mito_wrapper_dfs(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE_PATH, sheet_name=TEST_SHEET_NAME, index=False)

    mito.excel_range_import(TEST_FILE_PATH, TEST_SHEET_NAME, [{'type': 'range', 'df_name': 'df1', 'range': 'A1:B2'}])

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
        get_row_and_col_indexes_from_range(r)

    assert 'Invalid Range' in str(e_info) 