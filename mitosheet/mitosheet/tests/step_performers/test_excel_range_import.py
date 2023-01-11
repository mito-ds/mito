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
from mitosheet.excel_utils import get_row_and_col_index_from_cell_address
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

TEST_FILE = "test_file.xlsx"
TEST_SHEET = 'sheet1'
TEST_DF_1 = pd.DataFrame({'header 1': [1], 'header 2': [2]})
TEST_DF_2 = pd.DataFrame({'header 100': [1], 'header 200': [2]})

EXCEL_RANGE_IMPORT_TESTS = [
    (
        {'dataframe_1': {'type': 'range', 'range': 'A1:B2'}},
        [TEST_DF_1]
    ),
    (
        {'dataframe_1': {'type': 'range', 'range': 'A1:B2'}, 'dataframe_2': {'type': 'range', 'range': 'A4:B5'}},
        [TEST_DF_1, TEST_DF_2]
    ),
    (
        {'a bad dataframe name': {'type': 'range', 'range': 'A1:B2'}, '97 also bad': {'type': 'range', 'range': 'A4:B5'}},
        [TEST_DF_1, TEST_DF_2]
    ),
]
@pytest.mark.parametrize("imports, dfs", EXCEL_RANGE_IMPORT_TESTS)
def test_excel_range_import(imports, dfs):
    # Write an Excel file
    with pd.ExcelWriter(TEST_FILE) as writer:
        print(imports)
        for index, (_, range_import) in enumerate(imports.items()):
            (startrow, startcol) = get_row_and_col_index_from_cell_address(range_import['range'].split(':')[0])
            dfs[index].to_excel(writer, sheet_name=TEST_SHEET, startrow=startrow, startcol=startcol, index=False)  

    mito = create_mito_wrapper_dfs()

    mito.excel_range_import(TEST_FILE, TEST_SHEET, imports)

    assert len(mito.dfs) == len(imports)
    for actual, expected in zip(mito.dfs, dfs):
        assert actual.equals(expected)

    os.remove(TEST_FILE)


def test_import_with_defined_name_works():
    mito = create_mito_wrapper_dfs(TEST_DF_1)
    TEST_DF_2.to_excel(TEST_FILE, sheet_name=TEST_SHEET, index=False)

    mito.excel_range_import(TEST_FILE, TEST_SHEET, {'df1': {'type': 'range', 'range': 'A1:B2'}})

    assert len(mito.dfs) == 2
    assert TEST_DF_1.equals(mito.dfs[0])
    assert TEST_DF_2.equals(mito.dfs[1])

    # Make sure all names are unique
    assert len(set(mito.df_names)) == len(mito.df_names)