#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import os
from mitosheet.step_performers.graph_steps.graph_utils import BAR
from mitosheet.transpiler.transpile_utils import NEWLINE_TAB, TAB, NEWLINE
import pytest
import pandas as pd

from mitosheet.api.get_parameterizable_params import get_parameterizable_params
from mitosheet.transpiler.transpile import transpile
from mitosheet.tests.test_utils import create_mito_wrapper_with_data, create_mito_wrapper
from mitosheet.tests.decorators import pandas_post_1_2_only, python_post_3_6_only
from mitosheet.types import FC_NUMBER_GREATER

def test_transpile_single_column():
    mito = create_mito_wrapper_with_data(['abc'])
    mito.set_formula('=A', 0, 'B', add_column=True)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        "df1['B'] = df1[\'A\']", 
        ''
    ]


def test_transpile_multiple_columns_no_relationship():
    mito = create_mito_wrapper_with_data(['abc'])
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')
    print(mito.transpiled_code)
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'df1[\'B\'] = 0', 
        '',
        'df1[\'C\'] = 0', 
        ''
    ]

def test_transpile_columns_in_each_sheet():
    mito = create_mito_wrapper_with_data(['abc'], sheet_two_A_data=['abc'])
    mito.add_column(0, 'B')
    mito.add_column(1, 'B')

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'df1[\'B\'] = 0',
        '',
        'df2[\'B\'] = 0',
        ''
    ]

def test_transpile_multiple_columns_linear():
    mito = create_mito_wrapper_with_data(['abc'])
    mito.set_formula('=A', 0, 'B', add_column=True)
    mito.set_formula('=B', 0, 'C', add_column=True)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'df1[\'B\'] = df1[\'A\']',
        '',
        'df1[\'C\'] = df1[\'B\']',
        '',
    ]

COLUMN_HEADERS = [
    ('ABC'),
    ('ABC_D'),
    ('ABC_DEF'),
    ('ABC_123'),
    ('ABC_HAHA_123'),
    ('ABC_HAHA-123'),
    ('---data---'),
    ('---da____ta---'),
    ('--'),
]
@pytest.mark.parametrize("column_header", COLUMN_HEADERS)
def test_transpile_column_headers_non_alphabet(column_header):
    mito = create_mito_wrapper_with_data(['abc'])
    mito.set_formula('=A', 0, column_header, add_column=True)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        f'df1[\'{column_header}\'] = df1[\'A\']', 
        '',
    ]


COLUMN_HEADERS = [
    ('ABC'),
    ('ABC_D'),
    ('ABC_DEF'),
    ('ABC_123'),
    ('ABC_HAHA_123'),
    ('ABC_HAHA-123'),
    ('---data---'),
    ('---da____ta---'),
    ('--'),
]
@pytest.mark.parametrize("column_header", COLUMN_HEADERS)
def test_transpile_column_headers_non_alphabet_multi_sheet(column_header):
    mito = create_mito_wrapper_with_data(['abc'], sheet_two_A_data=['abc'])
    mito.set_formula('=A', 0, column_header, add_column=True)
    mito.set_formula('=A', 1, column_header, add_column=True)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        f'df1[\'{column_header}\'] = df1[\'A\']', 
        '',
        f'df2[\'{column_header}\'] = df2[\'A\']', 
        '',
    ]

def test_preserves_order_columns():
    mito = create_mito_wrapper_with_data(['abc'])
    # Topological sort will currently display this in C, B order
    mito.add_column(0, 'B')
    mito.add_column(0, 'C')

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'df1[\'B\'] = 0',
        '',
        'df1[\'C\'] = 0',
        '',
    ]

def test_transpile_delete_columns():
    df1 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    mito = create_mito_wrapper(df1)
    mito.delete_columns(0, ['C', 'B'])

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'df1.drop([\'C\', \'B\'], axis=1, inplace=True)',
        '',
    ]


# TESTING OPTIMIZATION

def test_removes_unedited_formulas_for_unedited_sheets():
    df1 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    df2 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    mito = create_mito_wrapper(df1, df2)

    mito.set_formula('=C', 0, 'D', add_column=True)
    mito.set_formula('=C', 1, 'D', add_column=True)

    mito.merge_sheets('lookup', 0, 1, [['A', 'A']], ['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D'])

    mito.set_formula('=C + 1', 1, 'D')

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        "df1['D'] = df1[\'C\']", 
        '',
        "df2['D'] = df2[\'C\']", 
        '',
        'temp_df = df2.drop_duplicates(subset=[\'A\']) # Remove duplicates so lookup merge only returns first match', 
        'df_merge = df1.merge(temp_df, left_on=[\'A\'], right_on=[\'A\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])',
        '',
        'df2[\'D\'] = df2[\'C\'] + 1',
        '',
    ]


def test_mulitple_merges_no_formula_steps():
    df1 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    df2 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    mito = create_mito_wrapper(df1, df2)
    mito.merge_sheets('lookup', 0, 1, [['A', 'A']], ['A', 'B', 'C'], ['A', 'B', 'C'])
    mito.merge_sheets('lookup', 0, 1, [['A', 'A']], ['A', 'B', 'C'], ['A', 'B', 'C'])
    mito.merge_sheets('lookup', 0, 1, [['A', 'A']], ['A', 'B', 'C'], ['A', 'B', 'C'])


    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'temp_df = df2.drop_duplicates(subset=[\'A\']) # Remove duplicates so lookup merge only returns first match', 
        'df_merge = df1.merge(temp_df, left_on=[\'A\'], right_on=[\'A\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])',
        '',
        'temp_df = df2.drop_duplicates(subset=[\'A\']) # Remove duplicates so lookup merge only returns first match', 
        'df_merge_1 = df1.merge(temp_df, left_on=[\'A\'], right_on=[\'A\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])',
        '',
        'temp_df = df2.drop_duplicates(subset=[\'A\']) # Remove duplicates so lookup merge only returns first match', 
        'df_merge_2 = df1.merge(temp_df, left_on=[\'A\'], right_on=[\'A\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])',
        '',
    ]

def test_optimization_with_other_edits():
    df1 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    df2 = pd.DataFrame(data={'A': [1], 'B': [101], 'C': [11]})
    mito = create_mito_wrapper(df1, df2)
    mito.add_column(0, 'D')
    mito.set_formula('=A', 0, 'D')
    mito.merge_sheets('lookup', 0, 1, [['A', 'A']], ['A', 'B', 'C', 'D'], ['A', 'B', 'C'])
    mito.add_column(0, 'AAA')
    mito.delete_columns(0, ['AAA'])

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        "df1['D'] = df1[\'A\']", 
        '',
        'temp_df = df2.drop_duplicates(subset=[\'A\']) # Remove duplicates so lookup merge only returns first match', 
        'df_merge = df1.merge(temp_df, left_on=[\'A\'], right_on=[\'A\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])',
        '',
    ]


def test_transpile_does_no_initial():
    df1 = pd.DataFrame(data={'First Name': ['Nate', 'Nate'], 123: ['Rush', 'Jack'], True: ['1', '2']})
    mito = create_mito_wrapper(df1)

    assert len(mito.transpiled_code) == 0

    
def test_transpile_reorder_column():
    df1 = pd.DataFrame(data={'A': ['aaron'], 'B': ['jon']})
    mito = create_mito_wrapper(df1)
    mito.reorder_column(0, 'A', 1)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'df1_columns = [col for col in df1.columns if col != \'A\']',
        'df1_columns.insert(1, \'A\')',
        'df1 = df1[df1_columns]',
        '',
    ]

def test_transpile_two_column_reorders():
    df1 = pd.DataFrame(data={'A': ['aaron'], 'B': ['jon']})
    mito = create_mito_wrapper(df1)
    mito.reorder_column(0, 'A', 1)
    mito.reorder_column(0, 'B', 1)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'df1_columns = [col for col in df1.columns if col != \'A\']',
        'df1_columns.insert(1, \'A\')',
        'df1 = df1[df1_columns]',
        '',
        'df1_columns = [col for col in df1.columns if col != \'B\']',
        'df1_columns.insert(1, \'B\')',
        'df1 = df1[df1_columns]',
        '',
    ]

def test_transpile_reorder_column_invalid():
    df1 = pd.DataFrame(data={'A': ['aaron'], 'B': ['jon']})
    mito = create_mito_wrapper(df1)
    mito.reorder_column(0, 'A', 5)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'df1_columns = [col for col in df1.columns if col != \'A\']',
        'df1_columns.insert(1, \'A\')',
        'df1 = df1[df1_columns]',
        '',
    ]

def test_transpile_merge_then_sort():
    df1 = pd.DataFrame(data={'Name': ["Aaron", "Nate"], 'Number': [123, 1]})
    df2 = pd.DataFrame(data={'Name': ["Aaron", "Nate"], 'Sign': ['Gemini', "Tarus"]})
    mito = create_mito_wrapper(df1, df2)
    mito.merge_sheets('lookup', 0, 1, [['Name', 'Name']], list(df1.keys()), list(df2.keys()))
    mito.sort(2, 'Number', 'ascending')

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'temp_df = df2.drop_duplicates(subset=[\'Name\']) # Remove duplicates so lookup merge only returns first match',
        'df_merge = df1.merge(temp_df, left_on=[\'Name\'], right_on=[\'Name\'], how=\'left\', suffixes=[\'_df1\', \'_df2\'])',
        '',
        'df_merge = df_merge.sort_values(by=\'Number\', ascending=True, na_position=\'first\')',
        '',
    ]

def test_transpile_multiple_pandas_imports_combined(tmp_path):
    tmp_file = str(tmp_path / 'txt.csv')
    df1 = pd.DataFrame(data={'Name': ["Aaron", "Nate"], 'Number': [123, 1]})
    df1.to_csv(tmp_file, index=False)
    mito = create_mito_wrapper(df1)
    mito.simple_import([tmp_file])
    mito.add_column(0, 'A', -1)
    mito.simple_import([tmp_file])
    mito.add_column(1, 'A', -1)
    mito.simple_import([tmp_file])

    assert len(mito.optimized_code_chunks) == 3
    assert 'import pandas as pd' in mito.transpiled_code
    assert len([c for c in mito.transpiled_code if c == 'import pandas as pd']) == 1

def test_transpile_as_function_no_params(tmp_path):
    tmp_file = str(tmp_path / 'txt.csv')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file, index=False)

    mito = create_mito_wrapper()
    mito.simple_import([tmp_file])
    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {}})

    print(mito.transpiled_code)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "import pandas as pd",
        "",
        "def function():",
        f"{TAB}txt = pd.read_csv(r'{tmp_file}')",
        f'{TAB}',
        f"{TAB}return txt",
        "",
        "txt = function()"
    ]

def test_transpile_as_function_no_call(tmp_path):
    tmp_file = str(tmp_path / 'txt.csv')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file, index=False)

    mito = create_mito_wrapper()
    mito.simple_import([tmp_file])
    mito.code_options_update_no_check_transpiled({'as_function': True, 'import_custom_python_code': False, 'call_function': False, 'function_name': 'function', 'function_params': {}})


    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "import pandas as pd",
        "",
        "def function():",
        f"{TAB}txt = pd.read_csv(r'{tmp_file}')",
        f'{TAB}',
        f"{TAB}return txt",
        ""
    ]

def test_transpile_as_function_df_params():
    mito = create_mito_wrapper(pd.DataFrame({'A': [1]}), arg_names=['df1'])
    mito.add_column(0, 'B')
    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {}})

    print(mito.transpiled_code)
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        '',
        'def function(df1):',
        f"{TAB}df1['B'] = 0",
        f'{TAB}',
        f"{TAB}return df1",
        "",
        "df1 = function(df1)"
    ]

def test_transpile_as_function_string_params():
    tmp_file = 'txt.csv'
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file, index=False)

    mito = create_mito_wrapper(str(tmp_file), arg_names=[f"'{tmp_file}'"])
    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {}})

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        'import pandas as pd',
        '',
        'def function(txt_path):',
        f"{TAB}# Read in filepaths as dataframes",
        f"{TAB}txt = pd.read_csv(txt_path)",
        f'{TAB}',
        f"{TAB}return txt",
        "",
        "txt = function('txt.csv')"
    ]

    os.remove(tmp_file)

def test_transpile_as_function_string_params_no_args_update():
    tmp_file = 'txt.csv'
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file, index=False)

    mito = create_mito_wrapper(str(tmp_file))
    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {}})

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        'import pandas as pd',
        '',
        'def function(txt_path):',
        f"{TAB}# Read in filepaths as dataframes",
        f"{TAB}txt = pd.read_csv(txt_path)",
        f'{TAB}',
        f"{TAB}return txt",
        "",
        'txt = function("txt.csv")'
    ]

    os.remove(tmp_file)

def test_transpile_as_function_both_params():
    tmp_file = 'txt.csv'
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file, index=False)

    mito = create_mito_wrapper(df1, str(tmp_file), arg_names=['df1', f"'{tmp_file}'"])
    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {}})

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        'import pandas as pd',
        '',
        'def function(df1, txt_path):',
        f"{TAB}# Read in filepaths as dataframes",
        f"{TAB}txt = pd.read_csv(txt_path)",
        f'{TAB}',
        f"{TAB}return df1, txt",
        "",
        "df1, txt = function(df1, 'txt.csv')"
    ]

    os.remove(tmp_file)


def test_transpile_pivot_table_indents():
    df1 = pd.DataFrame(data={'Name': ['Nate', 'Nate'], 'Height': [4, 5]})
    mito = create_mito_wrapper(df1, arg_names=['df1'])

    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {}})

    mito.pivot_sheet(
        0, 
        ['Name'],
        [],
        {'Height': ['sum']}
    )
    
    print("\n".join(mito.transpiled_code))
    assert "    pivot_table = tmp_df.pivot_table(\n        index=['Name'],\n        values=['Height'],\n        aggfunc={'Height': ['sum']}\n    )" in mito.transpiled_code


def test_transpile_as_function_single_param(tmp_path):
    tmp_file = str(tmp_path / 'txt.csv')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file, index=False)

    mito = create_mito_wrapper()
    mito.simple_import([tmp_file])
    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {'var_name': f"r'{tmp_file}'"}})

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "import pandas as pd",
        "",
        "def function(var_name):",
        f"{TAB}txt = pd.read_csv(var_name)",
        f'{TAB}',
        f"{TAB}return txt",
        "",
        f"var_name = r'{tmp_file}'",
        "",
        f"txt = function(var_name)"
    ]

def test_transpile_as_function_single_param_no_call(tmp_path):
    tmp_file = str(tmp_path / 'txt.csv')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file, index=False)

    mito = create_mito_wrapper()
    mito.simple_import([tmp_file])
    mito.code_options_update_no_check_transpiled({'as_function': True, 'import_custom_python_code': False, 'call_function': False, 'function_name': 'function', 'function_params': {'var_name': f"r'{tmp_file}'"}})

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "import pandas as pd",
        "",
        "def function(var_name):",
        f"{TAB}txt = pd.read_csv(var_name)",
        f'{TAB}',
        f"{TAB}return txt",
        "",
    ]


def test_transpile_as_function_both_params_and_additional():
    tmp_file = 'txt.csv'
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file, index=False)

    mito = create_mito_wrapper(df1, str(tmp_file), arg_names=['df1', f"'{tmp_file}'"])
    mito.simple_import([tmp_file])
    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {'var_name': f"r'{tmp_file}'"}})

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        'import pandas as pd',
        '',
        'def function(df1, txt_path, var_name):',
        f"{TAB}# Read in filepaths as dataframes",
        f"{TAB}txt = pd.read_csv(txt_path)",
        f'{TAB}',
        '    txt_1 = pd.read_csv(var_name)',
        f'{TAB}',
        f"{TAB}return df1, txt, txt_1",
        "",
        f"var_name = r'{tmp_file}'",
        "",
        f"df1, txt, txt_1 = function(df1, 'txt.csv', var_name)"
    ]

    os.remove(tmp_file)

def test_transpile_as_function_single_param_multiple_times(tmp_path):
    tmp_file = str(tmp_path / 'txt.csv')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file, index=False)

    mito = create_mito_wrapper()
    mito.simple_import([tmp_file])
    mito.simple_import([tmp_file])
    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {'var_name': f"r'{tmp_file}'"}})

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "import pandas as pd",
        "",
        "def function(var_name):",
        f"{TAB}txt = pd.read_csv(var_name)",
        f"{TAB}txt_1 = pd.read_csv(var_name)",
        f'{TAB}',
        f"{TAB}return txt, txt_1",
        "",
        f"var_name = r'{tmp_file}'",
        "",
        f"txt, txt_1 = function(var_name)"
    ]

@pandas_post_1_2_only
@python_post_3_6_only
@pytest.mark.parametrize("df_names, expected_in_transpile, expected_in_function", [(None, 'df1', 'import_dataframe_0'), (['test_df_name'], 'test_df_name', 'import_dataframe_0')])
def test_transpile_fully_parameterized_function_string_no_df_names(tmp_path, df_names, expected_in_transpile, expected_in_function):
    tmp_file1 = str(tmp_path / 'txt.csv')
    tmp_file2 = str(tmp_path / 'file.xlsx')
    tmp_exportfile1 = str(tmp_path / 'export.csv')
    tmp_exportfile2 = str(tmp_path / 'export.xlsx')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file1, index=False)
    df1.to_excel(tmp_file2, index=False)

    mito = create_mito_wrapper(df1, arg_names=df_names)
    # Test imports for excel and CSV
    mito.simple_import([tmp_file1])
    mito.excel_import(tmp_file2, sheet_names=['Sheet1'], has_headers=True, skiprows=0)

    # Test exports for excel and CSV
    mito.export_to_file('csv', [0], tmp_exportfile1)
    mito.export_to_file('excel', [1], tmp_exportfile2)

    mito.code_options_update({'as_function': False, 'import_custom_python_code': False, 'call_function': False, 'function_name': 'function', 'function_params': {}})
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "import pandas as pd",
        "",
        f"txt = pd.read_csv(r'{tmp_file1}')",
        "",
        f"sheet_df_dictonary = "
        f"pd.read_excel(r'{tmp_file2}', "
        "engine='openpyxl', sheet_name=[\n"
        f"{TAB}'Sheet1'{NEWLINE}"
        '], skiprows=0)',
        "Sheet1 = sheet_df_dictonary['Sheet1']",
        "",
        f"{expected_in_transpile}.to_csv(r'{tmp_exportfile1}', "
        'index=False)',
        '',
        'with '
        f"pd.ExcelWriter(r'{tmp_exportfile2}', "
        'engine="openpyxl") as writer:',
        '    txt.to_excel(writer, sheet_name="txt", index=False)',
        '',
    ]

    assert mito.mito_backend.fully_parameterized_function == f"""from mitosheet.public.v3 import *
import pandas as pd

def function({expected_in_function}, file_name_import_csv_0, file_name_import_excel_0, file_name_export_csv_0, file_name_export_excel_0):
    txt = pd.read_csv(file_name_import_csv_0)
    
    sheet_df_dictonary = pd.read_excel(file_name_import_excel_0, engine='openpyxl', sheet_name=[
        'Sheet1'
    ], skiprows=0)
    Sheet1 = sheet_df_dictonary['Sheet1']
    
    {expected_in_function}.to_csv(file_name_export_csv_0, index=False)
    
    with pd.ExcelWriter(file_name_export_excel_0, engine="openpyxl") as writer:
        txt.to_excel(writer, sheet_name="txt", index=False)
    
    return {expected_in_function}, txt, Sheet1
"""
    assert mito.mito_backend.param_metadata == [
        {
            'original_value': 'test_df_name' if df_names else 'df1',
            'type': 'import',
            'subtype': 'import_dataframe',
            'required': True,
            'name': expected_in_function
        },
        {
            'original_value': tmp_file1,
            'type': 'import',
            'subtype': 'file_name_import_csv',
            'name': 'file_name_import_csv_0',
            'required': False
        },
        {
            'original_value': tmp_file2,
            'type': 'import',
            'subtype': 'file_name_import_excel',
            'name': 'file_name_import_excel_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile1,
            'type': 'export',
            'subtype': 'file_name_export_csv',
            'name': 'file_name_export_csv_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile2,
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]


@pandas_post_1_2_only
@python_post_3_6_only
def test_transpile_fully_parameterized_function_string_no_df_name_param(tmp_path):
    tmp_file1 = str(tmp_path / 'txt.csv')
    tmp_file2 = str(tmp_path / 'file.xlsx')
    tmp_exportfile1 = str(tmp_path / 'export.csv')
    tmp_exportfile2 = str(tmp_path / 'export.xlsx')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file1, index=False)
    df1.to_excel(tmp_file2, index=False)

    mito = create_mito_wrapper()
    # Test imports for excel and CSV
    mito.simple_import([tmp_file1])
    mito.excel_import(tmp_file2, sheet_names=['Sheet1'], has_headers=True, skiprows=0)

    # Test exports for excel and CSV
    mito.export_to_file('csv', [0], tmp_exportfile1)
    mito.export_to_file('excel', [1], tmp_exportfile2)

    mito.code_options_update({'as_function': False, 'import_custom_python_code': False, 'call_function': False, 'function_name': 'function', 'function_params': {}})
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "import pandas as pd",
        "",
        f"txt = pd.read_csv(r'{tmp_file1}')",
        "",
        f"sheet_df_dictonary = "
        f"pd.read_excel(r'{tmp_file2}', "
        "engine='openpyxl', sheet_name=[\n"
        f"{TAB}'Sheet1'{NEWLINE}"
        '], skiprows=0)',
        "Sheet1 = sheet_df_dictonary['Sheet1']",
        "",
        f"txt.to_csv(r'{tmp_exportfile1}', "
        'index=False)',
        '',
        'with '
        f"pd.ExcelWriter(r'{tmp_exportfile2}', "
        'engine="openpyxl") as writer:',
        '    Sheet1.to_excel(writer, sheet_name="Sheet1", index=False)',
        '',
    ]

    assert mito.mito_backend.fully_parameterized_function == f"""from mitosheet.public.v3 import *
import pandas as pd

def function(file_name_import_csv_0, file_name_import_excel_0, file_name_export_csv_0, file_name_export_excel_0):
    txt = pd.read_csv(file_name_import_csv_0)
    
    sheet_df_dictonary = pd.read_excel(file_name_import_excel_0, engine='openpyxl', sheet_name=[
        'Sheet1'
    ], skiprows=0)
    Sheet1 = sheet_df_dictonary['Sheet1']
    
    txt.to_csv(file_name_export_csv_0, index=False)
    
    with pd.ExcelWriter(file_name_export_excel_0, engine="openpyxl") as writer:
        Sheet1.to_excel(writer, sheet_name="Sheet1", index=False)
    
    return txt, Sheet1
"""
    assert mito.mito_backend.param_metadata == [
        {
            'original_value': tmp_file1,
            'type': 'import',
            'subtype': 'file_name_import_csv',
            'name': 'file_name_import_csv_0',
            'required': False
        },
        {
            'original_value': tmp_file2,
            'type': 'import',
            'subtype': 'file_name_import_excel',
            'name': 'file_name_import_excel_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile1,
            'type': 'export',
            'subtype': 'file_name_export_csv',
            'name': 'file_name_export_csv_0',
            'required': False
        },
        {
            'original_value': tmp_exportfile2,
            'type': 'export',
            'subtype': 'file_name_export_excel',
            'name': 'file_name_export_excel_0',
            'required': False
        }
    ]


@pandas_post_1_2_only
@python_post_3_6_only
def test_fully_parameterized_function_custom_imports():
    mito = create_mito_wrapper(sheet_functions=[ADDONE], importers=[custom_import])
    mito.user_defined_import('custom_import', {})
    mito.set_formula('=ADDONE(A)', 0, 'B', add_column=True)

    mito.code_options_update({'as_function': False, 'import_custom_python_code': False, 'call_function': False, 'function_name': 'function', 'function_params': {}})
    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *

df0 = custom_import()

df0['B'] = ADDONE(df0['A'])
"""

    assert mito.mito_backend.fully_parameterized_function == """from mitosheet.public.v3 import *
from mitosheet.tests.test_transpile import custom_import, ADDONE

def function():
    df0 = custom_import()
    
    df0['B'] = ADDONE(df0['A'])
    
    return df0
"""

def test_transpile_as_function_multiple_params(tmp_path):
    tmp_file1 = str(tmp_path / 'txt.csv')
    tmp_file2 = str(tmp_path / 'file.csv')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_csv(tmp_file1, index=False)
    df1.to_csv(tmp_file2, index=False)

    mito = create_mito_wrapper()
    mito.simple_import([tmp_file1])
    mito.simple_import([tmp_file2])
    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {'var_name1': f"r'{tmp_file1}'", 'var_name2': f"r'{tmp_file2}'"}})

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "import pandas as pd",
        "",
        "def function(var_name1, var_name2):",
        f"{TAB}txt = pd.read_csv(var_name1)",
        f"{TAB}file = pd.read_csv(var_name2)",
        f'{TAB}',
        f"{TAB}return txt, file",
        "",
        f"var_name1 = r'{tmp_file1}'",
        f"var_name2 = r'{tmp_file2}'",
        "",
        f"txt, file = function(var_name1, var_name2)"
    ]

@pandas_post_1_2_only
@python_post_3_6_only
def test_transpile_parameterize_excel_imports(tmp_path):
    tmp_file = str(tmp_path / 'txt.xlsx')
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df1.to_excel(tmp_file, index=False)

    mito = create_mito_wrapper()
    mito.excel_import(tmp_file, sheet_names=['Sheet1'], has_headers=True, skiprows=0)
    mito.excel_range_import(tmp_file, {'type': 'sheet name', 'value': 'Sheet1'}, [{'type': 'range', 'df_name': 'dataframe_1', 'value': 'A1:B2'}], convert_csv_to_xlsx=False)
    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {'var_name': f"r'{tmp_file}'"}})

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "import pandas as pd",
        "",
        "def function(var_name):",
        f"{TAB}sheet_df_dictonary = pd.read_excel(var_name, engine='openpyxl', sheet_name=[\n"
        f"{TAB*2}'Sheet1'\n"
        f"{TAB}], skiprows=0)",
        f"{TAB}Sheet1 = sheet_df_dictonary['Sheet1']",
        f'{TAB}',
        f"{TAB}dataframe_1 = pd.read_excel(var_name, sheet_name='Sheet1', skiprows=0, nrows=1, usecols='A:B')",
        f'{TAB}',
        f"{TAB}return Sheet1, dataframe_1",
        "",
        f"var_name = r'{tmp_file}'",
        "",
        f"Sheet1, dataframe_1 = function(var_name)"
    ]

def test_transpile_with_function_params_over_mitosheet():
    df1 = pd.DataFrame({'A': [1], 'B': [2]})
    df2 = pd.DataFrame({'A': [1], 'B': [2]})
    mito = create_mito_wrapper(df1, df2, arg_names=['df', 'df_copy'])
    mito.add_column(0, 'C')
    mito.add_column(1, 'C')

    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {'param': "df"}})

    
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *',
        "",
        "def function(param, df_copy):",
        f"{TAB}param['C'] = 0",
        f"{TAB}",
        f"{TAB}df_copy['C'] = 0",
        f"{TAB}",
        f"{TAB}return param, df_copy",
        "",
        f"param = df",
        "",
        f"param, df_copy = function(param, df_copy)"
    ]

def test_transpile_does_not_effect_chars_in_strings():
    mito = create_mito_wrapper()
    quote = '"'
    mito.ai_transformation(
        'do a test',
        'v1',
        'test',
        'test',
        """
df = pd.DataFrame({'A': ["has a new \
line in it", '\t', '     ']})
        """
    )

    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {}})

    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *
import pandas as pd

def function():
    df = pd.DataFrame({'A': ["has a new \
line in it", '\t', '     ']})
    
    return df

df = function()"""

def test_transpile_with_multiline_ai_completion():
    mito = create_mito_wrapper()
    mito.ai_transformation(
        'do a test',
        'v1',
        'test',
        'test',
        """
import pandas as pd

# create sample dataframe
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})

print(df)
        """
    )

    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {}})

    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *

def function():
    import pandas as pd
    
    # create sample dataframe
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
    
    print(df)
    
    return df

df = function()"""

def test_transpiled_with_export_to_csv_singular():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, arg_names=['df'])
    mito.export_to_file('csv', [0], 'te"st.csv')

    assert [('df', 'import', 'import_dataframe'), ("r'te" + '"' + "st.csv'", 'export', 'file_name_export_csv')] == get_parameterizable_params({}, mito.mito_backend.steps_manager)

    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {'path': "r'te" + '"' + "st.csv'"}})

    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *

def function(df, path):
    df.to_csv(path, index=False)
    
    return df

path = r'te"st.csv'

df = function(df, path)"""

def test_transpiled_with_export_to_csv_multiple():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, df, arg_names=['df1', 'df2'])
    mito.export_to_file('csv', [0, 1], 'test.csv')

    assert [('df1', 'import', 'import_dataframe'), ('df2', 'import', 'import_dataframe'), ("r'test_0.csv'", 'export', 'file_name_export_csv'), ("r'test_1.csv'", 'export', 'file_name_export_csv')] == get_parameterizable_params({}, mito.mito_backend.steps_manager)

    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {'path_0': "r'test_0.csv'", 'path_1': "r'test_1.csv'"}})

    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *

def function(df1, df2, path_0, path_1):
    df1.to_csv(path_0, index=False)
    df2.to_csv(path_1, index=False)
    
    return df1, df2

path_0 = r'test_0.csv'
path_1 = r'test_1.csv'

df1, df2 = function(df1, df2, path_0, path_1)"""

def test_transpiled_with_export_to_xlsx_single():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, arg_names=['df'])
    mito.export_to_file('excel', [0], "te'st.xlsx")

    assert [('df', 'import', 'import_dataframe'), ('r"te' + "'" + 'st.xlsx"', 'export', 'file_name_export_excel')] == get_parameterizable_params({}, mito.mito_backend.steps_manager)

    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {'path': 'r"te' + "'" + 'st.xlsx"'}})

    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *
import pandas as pd

def function(df, path):
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="df", index=False)
    
    return df

path = r"te'st.xlsx"

df = function(df, path)"""

def test_transpiled_with_export_to_xlsx_multiple():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, df, arg_names=['df1', 'df2'])
    mito.export_to_file('excel', [0, 1], 'test.xlsx')

    assert [('df1', 'import', 'import_dataframe'), ('df2', 'import', 'import_dataframe'), ("r'test.xlsx'", 'export', 'file_name_export_excel')] == get_parameterizable_params({}, mito.mito_backend.steps_manager)

    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': {'path_0': "r'test.xlsx'"}})

    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *
import pandas as pd

def function(df1, df2, path_0):
    with pd.ExcelWriter(path_0, engine="openpyxl") as writer:
        df1.to_excel(writer, sheet_name="df1", index=False)
        df2.to_excel(writer, sheet_name="df2", index=False)
    
    return df1, df2

path_0 = r'test.xlsx'

df1, df2 = function(df1, df2, path_0)"""


def test_code_options_pass_param_subtype():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, arg_names=['df'])
    mito.export_to_file('csv', [0], 'test.csv')

    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': 'file_name_export_csv'})

    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *

def function(df, file_name_export_csv_0):
    df.to_csv(file_name_export_csv_0, index=False)
    
    return df

file_name_export_csv_0 = r'test.csv'

df = function(df, file_name_export_csv_0)"""

def test_code_options_pass_param_subtype_multiple_of_subtype():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, arg_names=['df'])
    mito.export_to_file('csv', [0], 'test.csv')
    mito.export_to_file('csv', [0], 'test1.csv')

    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': 'file_name_export_csv'})

    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *

def function(df, file_name_export_csv_0, file_name_export_csv_1):
    df.to_csv(file_name_export_csv_0, index=False)
    
    df.to_csv(file_name_export_csv_1, index=False)
    
    return df

file_name_export_csv_0 = r'test.csv'
file_name_export_csv_1 = r'test1.csv'

df = function(df, file_name_export_csv_0, file_name_export_csv_1)"""

def test_code_options_pass_multiple_param_subtype():
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, arg_names=['df'])
    mito.export_to_file('csv', [0], 'test.csv')
    mito.export_to_file('excel', [0], 'test.xlsx')

    mito.code_options_update({'as_function': True, 'import_custom_python_code': False, 'call_function': True, 'function_name': 'function', 'function_params': ['file_name_export_csv', 'file_name_export_excel']})

    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *
import pandas as pd

def function(df, file_name_export_csv_0, file_name_export_excel_0):
    df.to_csv(file_name_export_csv_0, index=False)
    
    with pd.ExcelWriter(file_name_export_excel_0, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="df", index=False)
    
    return df

file_name_export_csv_0 = r'test.csv'
file_name_export_excel_0 = r'test.xlsx'

df = function(df, file_name_export_csv_0, file_name_export_excel_0)"""

def ADDONE(x):
    return x + 1

def custom_import():
    return pd.DataFrame({'A': [1, 2, 3]})

def custom_edit(df: pd.DataFrame) -> pd.DataFrame:
    return df + 1

def test_code_options_include_functions():
    
    mito = create_mito_wrapper(sheet_functions=[ADDONE], importers=[custom_import], editors=[custom_edit])
    mito.user_defined_import('custom_import', {})
    mito.set_formula('=ADDONE(A)', 0, 'B', add_column=True)
    mito.user_defined_edit('custom_edit', {'df': 'df0'})

    mito.code_options_update({'as_function': True, 'import_custom_python_code': True, 'call_function': True, 'function_name': 'function', 'function_params': {}})
    print(mito.transpiled_code)
    assert "\n".join(mito.transpiled_code) == """from mitosheet.public.v3 import *
from mitosheet.tests.test_transpile import custom_import, ADDONE, custom_edit

def function():
    df0 = custom_import()
    
    df0['B'] = ADDONE(df0['A'])
    
    df0 = custom_edit(df=df0)
    
    return df0

df0 = function()"""


def test_transpile_handles_new_line_character():
    df = pd.DataFrame({'A\nB': [1,2,3]})
    mito = create_mito_wrapper(df)

    mito.filter(0, 'A\nB', "And", FC_NUMBER_GREATER, 1)

    assert "\n".join(mito.transpiled_code_with_comments) == """from mitosheet.public.v3 import *

# Filtered A
# B
df1 = df1[df1['A\\nB'] > 1]
"""


def test_transpile_optimizes_renames_out_of_order():
    df = pd.DataFrame({'A': [1], 'B': [2]})
    mito = create_mito_wrapper(df, df)

    mito.rename_column(0, 'A', 'AA')
    mito.rename_column(1, 'A', 'AA')
    mito.rename_column(0, 'B', 'BB')

    assert mito.dfs[0].equals(pd.DataFrame({'AA': [1], 'BB': [2]}))
    assert mito.dfs[1].equals(pd.DataFrame({'AA': [1], 'B': [2]}))

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '', 
        "df1.rename(columns={'A': 'AA', 'B': 'BB'}, inplace=True)", 
        '', 
        "df2.rename(columns={'A': 'AA'}, inplace=True)", 
        '',
    ]

def test_transpile_optimizes_many_renames_out_of_order():
    df = pd.DataFrame({'A': [1], 'B': [2], 'C': [3]})
    mito = create_mito_wrapper(df, df)

    mito.rename_column(0, 'A', 'AA')
    mito.rename_column(1, 'A', 'AA')
    mito.rename_column(0, 'B', 'BB')
    mito.rename_column(1, 'B', 'BB')
    mito.rename_column(0, 'C', 'CC')
    mito.rename_column(1, 'C', 'CC')

    assert mito.dfs[0].equals(pd.DataFrame({'AA': [1], 'BB': [2], 'CC': [3]}))
    assert mito.dfs[1].equals(pd.DataFrame({'AA': [1], 'BB': [2], 'CC': [3]}))

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '', 
        "df1.rename(columns={'A': 'AA', 'B': 'BB', 'C': 'CC'}, inplace=True)", 
        '', 
        "df2.rename(columns={'A': 'AA', 'B': 'BB', 'C': 'CC'}, inplace=True)", 
        '',
    ]

def test_can_optimize_around_imports(tmp_path):
    df = pd.DataFrame({'A': [1], 'B': [2], 'C': [3]})
    path = str(tmp_path / 'test.csv')
    df.to_csv(path, index=False)

    mito = create_mito_wrapper()
    mito.simple_import([path])
    mito.add_column(0, 'D')
    mito.add_column(0, 'E')
    mito.simple_import([path])
    mito.delete_columns(0, ['D', 'E'])

    assert len(mito.dfs) == 2
    assert mito.dfs[0].equals(df)
    assert mito.dfs[1].equals(df)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        'import pandas as pd', 
        '', 
        f"test = pd.read_csv(r'{path}')", 
        f"test_1 = pd.read_csv(r'{path}')", 
        '', 
    ]

def test_can_optimize_imports_together_if_just_edits(tmp_path):
    df = pd.DataFrame({'A': [1], 'B': [2], 'C': [3]})
    new_df = pd.DataFrame({'A': [1], 'B': [2], 'C': [3], 'D': [0], 'E': [0]})

    path = str(tmp_path / 'test.csv')
    df.to_csv(path, index=False)

    mito = create_mito_wrapper()
    mito.simple_import([path])
    mito.add_column(0, 'D')
    mito.add_column(0, 'E')
    mito.simple_import([path])

    assert len(mito.dfs) == 2
    assert mito.dfs[0].equals(new_df)
    assert mito.dfs[1].equals(df)

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        'import pandas as pd', 
        '', 
        f"test = pd.read_csv(r'{path}')", 
        f"test_1 = pd.read_csv(r'{path}')", 
        '', 
        "test['D'] = 0", 
        '', 
        "test['E'] = 0", 
        ''
    ]


def test_edit_dataframe_after_full_clear_does_not_reorder_strangely(tmp_path):
    df = pd.DataFrame({'A': [1], 'B': [2], 'C': [3]})
    new_df = pd.DataFrame({'A': [1], 'B': [2], 'C': [3], 'D': [0]})

    path = str(tmp_path / 'test.csv')
    df.to_csv(path, index=False)

    mito = create_mito_wrapper()
    mito.simple_import([path])
    mito.delete_dataframe(0)
    mito.simple_import([path])
    mito.add_column(0, 'D')

    assert len(mito.dfs) == 1
    assert mito.dfs[0].equals(new_df)
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        'import pandas as pd', 
        '', 
        f"test = pd.read_csv(r'{path}')", 
        '', 
        "test['D'] = 0", 
        ''
    ]


def test_all_edits_optimized_after_simple_imports(tmp_path):
    df = pd.DataFrame({'A': [1], 'B': [2], 'C': [3], 'D': [0], 'E': [0]})
    path = str(tmp_path / 'test.csv')
    df.to_csv(path, index=False)
    
    mito = create_mito_wrapper()
    mito.simple_import([path])
    mito.simple_import([path])

    mito.add_column(0, 'F')
    mito.add_column(1, 'F')

    mito.set_formula('=A + 1', 0, 'F')
    mito.set_formula('=B + 1', 1, 'F')

    assert len(mito.dfs) == 2
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        'import pandas as pd', 
        '', 
        f"test = pd.read_csv(r'{path}')",
        f"test_1 = pd.read_csv(r'{path}')", 
        '', 
        "test['F'] = test['A'] + 1",
        '',
        "test_1['F'] = test_1['B'] + 1",
        ''
    ]

@pytest.mark.skip(reason="This test is non-deterministic. Sometimes tmp_df = test[[\'B\', \'A\']].copy(), sometimes tmp_df = test[[\'A\', \'B\']].copy() ")
def test_all_edits_optimized_after_import_pivot(tmp_path):
    df = pd.DataFrame({'A': [1], 'B': [2], 'C': [3], 'D': [0], 'E': [0]})
    path = str(tmp_path / 'test.csv')
    df.to_csv(path, index=False)
    
    mito = create_mito_wrapper()
    mito.simple_import([path])

    mito.pivot_sheet(
        0, 
        ['A'],
        [],
        {'B': ['sum']}
    )

    mito.delete_columns(0, ['A'])
    mito.add_column(1, 'NEW')
    mito.delete_columns(0, ['B'])
    mito.set_formula('=A + 1', 1, 'NEW')
    mito.delete_columns(0, ['C'])

    assert len(mito.dfs) == 2
    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        'import pandas as pd', 
        '', 
        f"test = pd.read_csv(r'{path}')",
        '', 
        'tmp_df = test[[\'B\', \'A\']].copy()',
        'pivot_table = tmp_df.pivot_table(\n    index=[\'A\'],\n    values=[\'B\'],\n    aggfunc={\'B\': [\'sum\']}\n)',
        'pivot_table = pivot_table.set_axis([flatten_column_header(col) for col in pivot_table.keys()], axis=1)',
        'test_pivot = pivot_table.reset_index()',
        '',
        'test.drop([\'A\', \'B\', \'C\'], axis=1, inplace=True)',
        '',
        "test_pivot['NEW'] = test_pivot['A'] + 1",
        '',
    ]

def test_does_not_reorder_around_empty_code_chunk():
    df = pd.DataFrame({'A': [1], 'B': [2], 'C': [3]})
    mito = create_mito_wrapper(df)

    mito.add_column(0, 'D')
    mito.delete_columns(0, ['A', 'B'])
    result = mito.generate_graph('test', BAR, 0, False, ['C'], [], '400', '400')
    assert result
    assert mito.dfs[0].equals(pd.DataFrame({'C': [3], 'D': [0]}))