#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Export To File
"""

import glob
import os
import pandas as pd
import pytest
from mitosheet.tests.test_utils import check_dataframes_equal, create_mito_wrapper
from mitosheet.tests.decorators import pandas_post_1_2_only, python_post_3_6_only

EXPORT_TO_FILE_TESTS_CSV = [
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]})
        ],
        "csv", 
        [0], 
        "out",
        ['out.csv']
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
        ['out_0.txt', 'out_1.txt']
    ),
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"]}),
            pd.DataFrame({'F': [1, 2, 3], 'H': [1.0, 2.0, 3.0], 'I': [True, False, True], 'J': ["string", "with spaces", "and/!other@characters"]}),
        ],
        "csv", 
        [1], 
        "out",
        ['out.csv']
    ),
]
@pandas_post_1_2_only
@python_post_3_6_only
@pytest.mark.parametrize("input_dfs, type, sheet_indexes, file_name, final_file_names", EXPORT_TO_FILE_TESTS_CSV)
def test_export_to_file_csv(tmp_path, input_dfs, type, sheet_indexes, file_name, final_file_names):
    file_name = str(tmp_path / file_name)

    mito = create_mito_wrapper(*input_dfs)

    mito.export_to_file(type, sheet_indexes, file_name)

    for sheet_index, final_file_name_part in zip(sheet_indexes, final_file_names):
        final_file_name = str(tmp_path / final_file_name_part)
        assert pd.read_csv(final_file_name).equals(input_dfs[sheet_index])

    # Remove the files, run generated code, and check that things are still equal
    files = glob.glob(str(tmp_path / '*'))
    for f in files:
        os.remove(f)
    assert len(os.listdir(tmp_path)) == 0

    check_dataframes_equal(mito)

    for sheet_index, final_file_name in zip(sheet_indexes, final_file_names):
        final_file_name = str(tmp_path / final_file_name)
        assert os.path.exists(final_file_name)
        assert pd.read_csv(final_file_name).equals(input_dfs[sheet_index])
    

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
@pandas_post_1_2_only
@python_post_3_6_only
@pytest.mark.parametrize("input_dfs, type, sheet_indexes, file_name, df_names, final_file_name, final_sheet_names", EXPORT_TO_FILE_TESTS_EXCEL)
def test_export_to_file_excel(tmp_path, input_dfs, type, sheet_indexes, file_name, df_names, final_file_name, final_sheet_names):
    file_name = str(tmp_path / file_name)

    mito = create_mito_wrapper(*input_dfs)
    for sheet_index, df_name in zip(sheet_indexes, df_names):
        mito.rename_dataframe(sheet_index, df_name)

    mito.export_to_file(type, sheet_indexes, file_name)

    final_file_name = str(tmp_path / final_file_name)
    assert os.path.exists(final_file_name)
    for sheet_index, sheet_name in zip(sheet_indexes, final_sheet_names):
        assert pd.read_excel(final_file_name, sheet_name=sheet_name).equals(input_dfs[sheet_index])

    # Remove the files, run generated code, and check that things are still equal
    files = glob.glob(str(tmp_path / '*'))
    for f in files:
        os.remove(f)
    assert len(os.listdir(tmp_path)) == 0

    check_dataframes_equal(mito)

    assert os.path.exists(final_file_name)
    for sheet_index, sheet_name in zip(sheet_indexes, final_sheet_names):
        assert pd.read_excel(final_file_name, sheet_name=sheet_name).equals(input_dfs[sheet_index])


def test_transpiled_with_export_to_xlsx_format():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, arg_names=['df'])
    mito.set_dataframe_format(0, {'headers': { 'color': '#ffffff', 'backgroundColor': '#000000'}, "columns": {}, "rows": {}, "border": {}, "conditional_formats": []})
    filename = 'test_format.xlsx'
    mito.export_to_file('excel', [0], filename)
    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *
import pandas as pd

with pd.ExcelWriter(r\'test_format.xlsx\', engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="df", index=False)
    add_formatting_to_excel_sheet(writer, "df", "#000000", "#ffffff")

df_styler = df.style\\
    .set_table_styles([
        {'selector': 'thead', 'props': [('color', '#ffffff'), ('background-color', '#000000')]},
])
"""

