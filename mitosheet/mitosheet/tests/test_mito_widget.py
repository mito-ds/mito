#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.
import os
import pandas as pd
import pytest

from mitosheet.mito_widget import MitoWidget, sheet
from mitosheet.transpiler.transpile import transpile
from mitosheet.tests.decorators import pandas_post_1_only


def test_example_creation_blank():
    df = pd.DataFrame()
    w = MitoWidget(df)

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
    mito = sheet(df)
    assert mito is not None
    assert list(mito.steps_manager.curr_step.dfs[0].keys()) == list(df.keys())


def test_create_with_multiple_dataframes():
    mito = sheet(pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame(data={'A': [1, 2, 3]}))
    assert mito is not None

def test_can_call_sheet_with_just_filename():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv('../1.csv', index=False)

    mito = sheet('../1.csv')

    assert len(mito.steps_manager.dfs) == 1
    assert mito.steps_manager.dfs[0].equals(df)

    # Remove the test file
    os.remove('../1.csv')


def test_can_call_sheet_with_filename_mulitiple_times():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv('../1.csv', index=False)

    mito = sheet('../1.csv', '../1.csv')

    assert len(mito.steps_manager.dfs) == 2
    assert mito.steps_manager.dfs[0].equals(df)
    assert mito.steps_manager.dfs[1].equals(df)
    assert mito.steps_manager.curr_step.df_names[0] != mito.steps_manager.curr_step.df_names[1]

    # Remove the test file
    os.remove('../1.csv')


def test_can_call_sheet_with_df_and_filename():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv('../1.csv', index=False)

    mito = sheet(df, '../1.csv')

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
    mito = sheet('test_file_path.csv')
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
    sheet(df)

    # Test we don't change the headers!
    assert df.columns.tolist() == ['A A']

def test_can_call_with_indexes():
    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': ['A', 'B', 'C'], 'D': ['E', 'F', 'G']})

    string_index = df.set_index('B')
    sheet(string_index)

    multi_index = df.set_index(['B', 'D'])
    sheet(multi_index)