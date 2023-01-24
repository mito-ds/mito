#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.
import json
import os
import pandas as pd
import pytest

from mitosheet.mito_backend import MitoBackend, get_mito_backend
from mitosheet.tests.test_utils import create_mito_wrapper, create_mito_wrapper_dfs
from mitosheet.transpiler.transpile import transpile
from mitosheet.tests.decorators import pandas_post_1_only
from mitosheet.utils import MAX_COLUMNS


def test_example_creation_blank():
    df = pd.DataFrame()
    w = MitoBackend(df)

VALID_DATAFRAMES = [
    (pd.DataFrame()),
    (pd.DataFrame(data={'A': [1, 2, 3]})),
    (pd.DataFrame(data={'A0123': [1, 2, 3]})),
    (pd.DataFrame(data={0: [1, 2, 3]})),
    (pd.DataFrame(data={0.1: [1, 2, 3]})),
    (pd.DataFrame(data={'A A A A': [1, 2, 3], 0: [1, 2, 3]})),
    (pd.DataFrame(data={'         a         ': [1, 2, 3], '123': [1, 2, 3]})),
    (pd.DataFrame(data={'## this is a test': [1, 2, 3], ' !': [1, 2, 3]})),
    (pd.DataFrame(data={'TOTAL': [1, 2, 3], '#123': [1, 2, 3]})),
    (pd.DataFrame(data={'NUMber': [1, 2, 3], '.,,': [1, 2, 3]})),
    (pd.DataFrame(data={'this is a possible ! column header that could be there': [1, 2, 3], '.,,': [1, 2, 3]})),
    (pd.DataFrame(data={1000.123123: [1, 2, 3], 52.100: [1, 2, 3]})),
]
@pytest.mark.parametrize("df", VALID_DATAFRAMES)
def test_sheet_creates_valid_dataframe(df):
    mito = get_mito_backend(df)
    assert mito is not None
    assert list(mito.steps_manager.curr_step.dfs[0].keys()) == list(df.keys())


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
        '# Read in filepaths as dataframes',
        'df_1 = pd.read_csv(r\'../1.csv\')',
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
        '# Read in filepaths as dataframes',
        f'test_file_path = pd.read_csv(r\'test_file_path.csv\', encoding=\'{encoding}\')',
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
    mito = create_mito_wrapper_dfs(df)
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
