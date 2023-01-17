#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Export To File
"""

import os
import pandas as pd
import pytest
from mitosheet.tests.test_utils import check_dataframes_equal, create_mito_wrapper_dfs

EXPORT_TO_FILE_TESTS_CSV = [
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]})
        ],
        "csv", 
        [0], 
        "out",
        ['out.txt']
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]})
        ],
        "csv", 
        [0], 
        "out.txt",
        ['out.txt']
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]}),
            pd.DataFrame({'F': [1, 2, 3], 'H': [1.0, 2.0, 3.0], 'I': [True, False, True], 'J': ["string", "with spaces", "and/!other@characters"]}),
        ],
        "csv", 
        [0, 1], 
        "out.txt",
        ['out_df1.txt', 'out_df2.txt']
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]}),
            pd.DataFrame({'F': [1, 2, 3], 'H': [1.0, 2.0, 3.0], 'I': [True, False, True], 'J': ["string", "with spaces", "and/!other@characters"]}),
        ],
        "csv", 
        [1], 
        "out.txt",
        ['out.txt']
    ),
]
@pytest.mark.parametrize("input_dfs, type, sheet_indexes, file_name, final_file_names", EXPORT_TO_FILE_TESTS_CSV)
def test_export_to_file_csv(tmp_path, input_dfs, type, sheet_indexes, file_name, final_file_names):
    file_name = str(tmp_path / file_name)

    mito = create_mito_wrapper_dfs(*input_dfs)

    mito.export_to_file(type, sheet_indexes, file_name)

    for sheet_index, final_file_name in zip(sheet_indexes, final_file_names):
        final_file_name = str(tmp_path / final_file_name)
        assert os.path.exists(final_file_name)
        assert pd.read_csv(final_file_name).equals(input_dfs[sheet_index])

    check_dataframes_equal(mito)

EXPORT_TO_FILE_TESTS_EXCEL = [
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]})
        ],
        "excel", 
        [0], 
        "out", ['df1'],
        'out.xlsx', ['df1']
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]})
        ],
        "excel", 
        [0], 
        "out.xlsx", ['df1'],
        'out.xlsx', ['df1']
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]}),
            pd.DataFrame({'A': [1, 2, 3], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]}),
            pd.DataFrame({'A': [1, 2, 3], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]}),
        ],
        "excel", 
        [0, 1, 2], 
        "out", ['a name', 'an even longer name that is over 31 characters and so needs to be shortened', 'final'],
        'out.xlsx', ['a_name', 'an_even_longer_name_that_is_ove', 'final']
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]}),
            pd.DataFrame({'A': [1, 2, 3], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]}),
            pd.DataFrame({'A': [1, 2, 3], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]}),
        ],
        "excel", 
        [1, 2], 
        "out", ['an even longer name that is over 31 characters and so needs to be shortened', 'final'],
        'out.xlsx', ['an_even_longer_name_that_is_ove', 'final']
    ),
]
@pytest.mark.parametrize("input_dfs, type, sheet_indexes, file_name, df_names, final_file_name, final_sheet_names", EXPORT_TO_FILE_TESTS_EXCEL)
def test_export_to_file_excel(tmp_path, input_dfs, type, sheet_indexes, file_name, df_names, final_file_name, final_sheet_names):
    file_name = str(tmp_path / file_name)

    mito = create_mito_wrapper_dfs(*input_dfs)
    for sheet_index, df_name in zip(sheet_indexes, df_names):
        mito.rename_dataframe(sheet_index, df_name)

    mito.export_to_file(type, sheet_indexes, file_name)

    final_file_name = str(tmp_path / final_file_name)
    assert os.path.exists(final_file_name)
    for sheet_index, sheet_name in zip(sheet_indexes, final_sheet_names):
        print(pd.read_excel(final_file_name, sheet_name=sheet_name))
        print(input_dfs[sheet_index])
        assert pd.read_excel(final_file_name, sheet_name=sheet_name).equals(input_dfs[sheet_index])

    check_dataframes_equal(mito)
