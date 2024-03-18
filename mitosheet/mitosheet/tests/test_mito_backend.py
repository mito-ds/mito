#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.
from io import StringIO
import json
import os
import pandas as pd
from mitosheet.transpiler.transpile_utils import get_default_code_options
import pytest
import numpy as np

from mitosheet.mito_backend import MitoBackend, get_mito_backend
from mitosheet.tests.test_utils import create_mito_wrapper_with_data, create_mito_wrapper
from mitosheet.transpiler.transpile import transpile
from mitosheet.tests.decorators import pandas_post_1_only
from mitosheet.utils import MAX_COLUMNS


def test_example_creation_blank():
    df = pd.DataFrame()
    w = MitoBackend(df)

VALID_DATAFRAMES = [
    (pd.DataFrame(), None),
    (pd.DataFrame(data={'A': [1, 2, 3]}), None),
    (pd.DataFrame(data={'A0123': [1, 2, 3]}), None),
    (pd.DataFrame(data={0: [1, 2, 3]}), None),
    (pd.DataFrame(data={0.1: [1, 2, 3]}), None),
    (pd.DataFrame(data={'A A A A': [1, 2, 3], 0: [1, 2, 3]}), None),
    (pd.DataFrame(data={'         a         ': [1, 2, 3], '123': [1, 2, 3]}), None),
    (pd.DataFrame(data={'## this is a test': [1, 2, 3], ' !': [1, 2, 3]}), None),
    (pd.DataFrame(data={'TOTAL': [1, 2, 3], '#123': [1, 2, 3]}), None),
    (pd.DataFrame(data={'NUMber': [1, 2, 3], '.,,': [1, 2, 3]}), None),
    (pd.DataFrame(data={'this is a possible ! column header that could be there': [1, 2, 3], '.,,': [1, 2, 3]}), None),
    (pd.DataFrame(data={1000.123123: [1, 2, 3], 52.100: [1, 2, 3]}), None),

    # to_csv of file content
    (pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}).to_csv(index=False), pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})),
    # to_json of file content
    (pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}).to_json(), pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})),
    # to_dict of file content
    (pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}).to_dict('records'), pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})),
    # a list of strings (which are to_csv of file content)
    ([pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}).to_csv(index=False), pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]}).to_csv(index=False)], pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})),
]
@pytest.mark.parametrize("df", VALID_DATAFRAMES)
def test_df_creates_valid_df(df):
    print(df)
    print(type(df[0]))
    mito = create_mito_wrapper(df[0])
    assert mito.mito_backend is not None

    if df[1] is None:
        assert mito.mito_backend.steps_manager.curr_step.dfs[0].equals(df[0])
    else:
        assert mito.mito_backend.steps_manager.curr_step.dfs[0].equals(df[1])

def test_df_with_nan_creates_backend():
    df = pd.DataFrame(data={np.nan: [1, 2, 3], 52.100: [1, 2, 3]})
    mito = get_mito_backend(df)
    assert mito is not None
    assert np.array_equal(mito.steps_manager.curr_step.dfs[0].keys(), list(df.keys()), equal_nan=True)


def test_create_with_multiple_dataframes():
    mito = get_mito_backend(pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame(data={'A': [1, 2, 3]}))
    assert mito is not None

def test_can_call_sheet_with_just_filename():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv('../1.csv', index=False)

    mito = get_mito_backend('../1.csv')

    assert len(mito.steps_manager.dfs) == 1
    assert mito.steps_manager.dfs[0].equals(df)

    # Remove the test file
    os.remove('../1.csv')


def test_can_call_sheet_with_filename_mulitiple_times():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv('../1.csv', index=False)

    mito = get_mito_backend('../1.csv', '../1.csv')

    assert len(mito.steps_manager.dfs) == 2
    assert mito.steps_manager.dfs[0].equals(df)
    assert mito.steps_manager.dfs[1].equals(df)
    assert mito.steps_manager.curr_step.df_names[0] != mito.steps_manager.curr_step.df_names[1]

    # Remove the test file
    os.remove('../1.csv')


def test_can_call_sheet_with_df_and_filename():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv('../1.csv', index=False)

    mito = get_mito_backend(df, '../1.csv')

    assert len(mito.steps_manager.dfs) == 2
    assert mito.steps_manager.dfs[0].equals(mito.steps_manager.dfs[1])

    # Remove the test file
    os.remove('../1.csv')

    code_container = transpile(mito.steps_manager)

    assert code_container == [
        'from mitosheet.public.v3 import *',
        'import pandas as pd',
        '',
        '# Read in filepaths as dataframes',
        'df_1 = pd.read_csv(r\'../1.csv\')',
        '',
    ]

def test_can_use_utf_16_when_passing_string():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})

    encoding = 'UTF-16'
    df.to_csv('test_file_path.csv', index=False, encoding=encoding)

    # Create with no dataframes
    mito = get_mito_backend('test_file_path.csv')
    # And then import just a test file

    assert mito.steps_manager.dfs[0].equals(df)

    code_container = transpile(mito.steps_manager)

    assert code_container == [
        'from mitosheet.public.v3 import *',
        'import pandas as pd',
        '',
        '# Read in filepaths as dataframes',
        f'test_file_path = pd.read_csv(r\'test_file_path.csv\', encoding=\'{encoding}\')',
        '',
    ]
    os.remove('test_file_path.csv')


def test_call_makes_copies():
    df = pd.DataFrame(data={'A A': [1, 2, 3]})
    get_mito_backend(df)

    # Test we don't change the headers!
    assert df.columns.tolist() == ['A A']

def test_can_call_with_indexes():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': ['A', 'B', 'C'], 'D': ['E', 'F', 'G']})

    string_index = df.set_index('B')
    get_mito_backend(string_index)

    multi_index = df.set_index(['B', 'D'])
    get_mito_backend(multi_index)

def test_sheet_json_holds_all_columns():
    df = pd.DataFrame({i: [1, 2, 3] for i in range(MAX_COLUMNS + 100)})
    mito = create_mito_wrapper(df)
    sheet_data = json.loads(mito.sheet_data_json)[0]
    for i in range(MAX_COLUMNS, MAX_COLUMNS + 100):
        assert sheet_data['columnIDsMap'][str(i)] is not None
        assert sheet_data['columnFormulasMap'][str(i)] is not None
        assert sheet_data['columnFiltersMap'][str(i)] is not None
        assert sheet_data['columnIDsMap'][str(i)] is not None
        assert sheet_data['columnDtypeMap'][str(i)] is not None

@pandas_post_1_only
def test_throws_duplicated_column_error():
    with pytest.raises(ValueError) as e_info:
        df = pd.DataFrame(columns=['A', 'A'])
        get_mito_backend(df)
    assert 'A' in str(e_info)

def test_create_mito_backend_with_string_names_set_df_names():
    df = pd.DataFrame({i: [1, 2, 3] for i in range(MAX_COLUMNS + 100)})
    df.to_csv('test_file.csv', index=False)
    mito = create_mito_wrapper('test_file.csv')
    assert mito.mito_backend.steps_manager.curr_step.final_defined_state.df_names == ['test_file']
    os.remove('test_file.csv')

def test_create_backend_with_code_options_works():
    code_options = get_default_code_options('tmp')
    code_options['call_function'] = False
    mito_backend = MitoBackend(code_options=code_options)
    assert mito_backend.steps_manager.code_options == code_options

def test_create_backend_default_apply_formula_to_column():
    mito_backend = MitoBackend(default_editing_mode='cell')
    assert mito_backend.steps_manager.default_apply_formula_to_column == False

    mito_backend = MitoBackend(default_editing_mode='column')
    assert mito_backend.steps_manager.default_apply_formula_to_column == True

    mito_backend = MitoBackend()
    assert mito_backend.steps_manager.default_apply_formula_to_column == True

    