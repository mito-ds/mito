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
from typing import Any

import pandas as pd
from openpyxl import load_workbook

def get_cell_formatting(
    cell_address: str,
    file_path: str,
    sheet_name: str,
) -> Any:
    # Load the workbook using openpyxl
    wb = load_workbook(file_path)

    sheet = wb[sheet_name]
    formats = []
    for conditional in sheet.conditional_formatting._cf_rules.items():
        if conditional[0].__contains__(cell_address):
            formats.append((conditional[1][0].dxf.fill.start_color.rgb, conditional[1][0].dxf.font.color.rgb))
    return formats

DF_FORMAT_HEADER = {
    'headers': {
        'color': '#ffffff',
        'backgroundColor': '#000000'
    },
    "columns": {},
    "rows": {},
    "border": {},
    "conditional_formats": []
}

DF_FORMAT_ROWS = {
    'headers': {},
    "columns": {},
    "rows": {
        "even": {
            "color": "#ffffff",
            "backgroundColor": "#000000"
        },
        "odd": {
            "color": "#000000",
            "backgroundColor": "#ffffff"
        }
    },
    "border": {},
    "conditional_formats": []
}

DF_FORMAT_HEADER_AND_ROWS = {
    'headers': {
        'color': '#ffffff',
        'backgroundColor': '#000000'
    },
    "columns": {},
    "rows": {
        "even": {
            "color": "#ffffff",
            "backgroundColor": "#000000"
        },
        "odd": {
            "color": "#000000",
            "backgroundColor": "#ffffff"
        }
    },
    "border": {},
    "conditional_formats": []
}

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

# This tests when the user exports a dataframe without formatting.
def test_transpiled_with_export_to_xlsx_no_format():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, arg_names=['df'])
    filename = 'test_no_format.xlsx'
    mito.export_to_file('excel', [0], filename)
    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *
import pandas as pd

with pd.ExcelWriter(r\'test_no_format.xlsx\', engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="df", index=False)
"""

# This tests when the user exports a dataframe with formatting.
def test_transpiled_with_export_to_xlsx_format():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, arg_names=['df'])
    mito.set_dataframe_format(0, DF_FORMAT_HEADER)
    filename = 'test_format.xlsx'
    mito.export_to_file('excel', [0], filename)
    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *
import pandas as pd

with pd.ExcelWriter(r\'test_format.xlsx\', engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="df", index=False)
    add_formatting_to_excel_sheet(writer, "df", df, 
        header_background_color='#000000', 
        header_font_color='#ffffff'
    )

df_styler = df.style\\
    .set_table_styles([
        {'selector': 'thead', 'props': [('color', '#ffffff'), ('background-color', '#000000')]},
])
"""


# This tests when the user exports a dataframe with row formatting without header formatting.
def test_transpiled_with_export_to_xlsx_format_rows_no_header():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, arg_names=['df'])
    mito.set_dataframe_format(0, DF_FORMAT_ROWS)
    filename = 'test_format_rows_no_header.xlsx'
    mito.export_to_file('excel', [0], filename)
    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *
import pandas as pd

with pd.ExcelWriter(r\'test_format_rows_no_header.xlsx\', engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="df", index=False)
    add_formatting_to_excel_sheet(writer, "df", df, 
        even_background_color='#000000', 
        even_font_color='#ffffff', 
        odd_background_color='#ffffff', 
        odd_font_color='#000000'
    )

df_styler = df.style\\
    .set_table_styles([
        {'selector': 'tbody tr:nth-child(odd)', 'props': [('color', '#ffffff'), ('background-color', '#000000')]},
        {'selector': 'tbody tr:nth-child(even)', 'props': [('color', '#000000'), ('background-color', '#ffffff')]},
])
"""


CONDITIONAL_FORMATS = [
    (
        ['A'], 
        [{'condition': 'greater', 'value': 5}], 
        '#e72323', 
        '#ffffff'
    ),
    (
        ['A'],
        [{'condition': 'greater', 'value': 4}],
        '#abcdef', 
        '#000000'
    )
]
# This tests when the user exports a dataframe with row formatting without header formatting.
@pytest.mark.parametrize("column_ids, filters, background_color, font_color", CONDITIONAL_FORMATS)
def test_transpiled_with_export_to_xlsx_conditional_format(column_ids, filters, background_color, font_color):
    df = pd.DataFrame({'A': [4, 5, 6]})
    mito = create_mito_wrapper(df, arg_names=['df'])
    mito.set_dataframe_format(0, {
        'headers': {},
        "columns": {},
        "rows": {},
        "border": {},
        "conditional_formats": [
            {
                'format_uuid': '_hkyc4pcux',
                'columnIDs': column_ids,
                'filters': filters,
                'color': font_color,
                'backgroundColor': background_color
            }
        ]
    })
    filename = 'test_format_conditional.xlsx'
    mito.export_to_file('excel', [0], filename)
    assert "\n".join(mito.transpiled_code) == f"""from mitosheet.public.v3 import *
import pandas as pd
import numpy as np

with pd.ExcelWriter(r\'test_format_conditional.xlsx\', engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="df", index=False)
    add_formatting_to_excel_sheet(writer, "df", df, 
        conditional_formats=[
            {{'columns': {column_ids}, 'filters': {filters}, 'font_color': '{font_color}', 'background_color': '{background_color}'}}
        ]
    )

df_styler = df.style\\
    .apply(lambda series: np.where(series > {filters[0]['value']}, 'color: {font_color}; background-color: {background_color}', None), subset={column_ids})
"""


# This tests when the user exports a dataframe with row formatting without header formatting.
@pytest.mark.parametrize("column_ids, filters, background_color, font_color", CONDITIONAL_FORMATS)
def test_transpiled_with_export_to_xlsx_conditional_and_rows(column_ids, filters, background_color, font_color):
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, arg_names=['df'])
    mito.set_dataframe_format(0, {
        'headers': {},
        "columns": {},
        "rows": {
            "even": {
                "color": "#ffffff",
                "backgroundColor": "#000000"
            },
            "odd": {
                "color": "#000000",
                "backgroundColor": "#ffffff"
            }
        },
        "border": {},
        "conditional_formats": [
            {
                'format_uuid': '_hkyc4pcux',
                'columnIDs': column_ids,
                'filters': filters,
                'color': font_color,
                'backgroundColor': background_color
            }
        ]
    })
    filename = 'test_format_conditional_and_rows.xlsx'
    mito.export_to_file('excel', [0], filename)
    assert "\n".join(mito.transpiled_code) == f"""from mitosheet.public.v3 import *
import pandas as pd
import numpy as np

with pd.ExcelWriter(r\'test_format_conditional_and_rows.xlsx\', engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="df", index=False)
    add_formatting_to_excel_sheet(writer, "df", df, 
        even_background_color='#000000', 
        even_font_color='#ffffff', 
        odd_background_color='#ffffff', 
        odd_font_color='#000000', 
        conditional_formats=[
            {{'columns': {column_ids}, 'filters': {filters}, 'font_color': '{font_color}', 'background_color': '{background_color}'}}
        ]
    )

df_styler = df.style\\
    .set_table_styles([
        {{'selector': 'tbody tr:nth-child(odd)', 'props': [('color', '#ffffff'), ('background-color', '#000000')]}},
        {{'selector': 'tbody tr:nth-child(even)', 'props': [('color', '#000000'), ('background-color', '#ffffff')]}},
])\\
    .apply(lambda series: np.where(series > {filters[0]['value']}, 'color: {font_color}; background-color: {background_color}', None), subset={column_ids})
"""

# This tests when the user exports two dataframes with both formatted.
def test_transpiled_with_export_to_xlsx_format_two_sheets():
    df_1 = pd.DataFrame({'A': [1, 2, 3]})
    df_2 = pd.DataFrame({'B': [4, 5, 6]})
    mito = create_mito_wrapper(df_1, df_2, arg_names=['df_1', 'df_2'])
    mito.set_dataframe_format(0, DF_FORMAT_HEADER)
    mito.set_dataframe_format(1, DF_FORMAT_HEADER_AND_ROWS)
    filename = 'test_format_two.xlsx'
    mito.export_to_file('excel', [0, 1], filename)
    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *
import pandas as pd

with pd.ExcelWriter(r\'test_format_two.xlsx\', engine="openpyxl") as writer:
    df_1.to_excel(writer, sheet_name="df_1", index=False)
    df_2.to_excel(writer, sheet_name="df_2", index=False)
    add_formatting_to_excel_sheet(writer, "df_1", df_1, 
        header_background_color='#000000', 
        header_font_color='#ffffff'
    )
    add_formatting_to_excel_sheet(writer, "df_2", df_2, 
        header_background_color='#000000', 
        header_font_color='#ffffff', 
        even_background_color='#000000', 
        even_font_color='#ffffff', 
        odd_background_color='#ffffff', 
        odd_font_color='#000000'
    )

df_1_styler = df_1.style\\
    .set_table_styles([
        {'selector': 'thead', 'props': [('color', '#ffffff'), ('background-color', '#000000')]},
])
df_2_styler = df_2.style\\
    .set_table_styles([
        {'selector': 'thead', 'props': [('color', '#ffffff'), ('background-color', '#000000')]},
        {'selector': 'tbody tr:nth-child(odd)', 'props': [('color', '#ffffff'), ('background-color', '#000000')]},
        {'selector': 'tbody tr:nth-child(even)', 'props': [('color', '#000000'), ('background-color', '#ffffff')]},
])
"""

# This tests when the user exports two dataframes with one formatted. 
def test_transpiled_with_export_two_sheets_to_xlsx_format_one():
    df_1 = pd.DataFrame({'A': [1, 2, 3]})
    df_2 = pd.DataFrame({'B': [4, 5, 6]})
    mito = create_mito_wrapper(df_1, df_2, arg_names=['df_1', 'df_2'])
    mito.set_dataframe_format(0, DF_FORMAT_HEADER_AND_ROWS)
    filename = 'test_two_format_one.xlsx'
    mito.export_to_file('excel', [0, 1], filename)
    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *
import pandas as pd

with pd.ExcelWriter(r\'test_two_format_one.xlsx\', engine="openpyxl") as writer:
    df_1.to_excel(writer, sheet_name="df_1", index=False)
    df_2.to_excel(writer, sheet_name="df_2", index=False)
    add_formatting_to_excel_sheet(writer, "df_1", df_1, 
        header_background_color='#000000', 
        header_font_color='#ffffff', 
        even_background_color='#000000', 
        even_font_color='#ffffff', 
        odd_background_color='#ffffff', 
        odd_font_color='#000000'
    )

df_1_styler = df_1.style\\
    .set_table_styles([
        {'selector': 'thead', 'props': [('color', '#ffffff'), ('background-color', '#000000')]},
        {'selector': 'tbody tr:nth-child(odd)', 'props': [('color', '#ffffff'), ('background-color', '#000000')]},
        {'selector': 'tbody tr:nth-child(even)', 'props': [('color', '#000000'), ('background-color', '#ffffff')]},
])
"""

