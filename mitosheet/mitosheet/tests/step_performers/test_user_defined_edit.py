#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for UserDefinedImport
"""

import pandas as pd
from mitosheet.enterprise.mito_config import MITO_CONFIG_CUSTOM_IMPORTERS_PATH, MITO_CONFIG_VERSION
from mitosheet.errors import MitoError
from mitosheet.tests.test_mito_config import delete_all_mito_config_environment_variables
from mitosheet.utils import get_new_id
import pytest
import json
import os
from mitosheet.tests.test_utils import create_mito_wrapper

START_DF = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
ADDED_COL_DF = pd.DataFrame({'New Column': [0, 0, 0], 'A': [1, 2, 3], 'B': [4, 5, 6]})
RENAMED_COL_DF = pd.DataFrame({'abcA': [1, 2, 3], 'abcB': [4, 5, 6]})
REORDER_COL_DF = pd.DataFrame({'B': [4, 5, 6], 'A': [1, 2, 3], })

def no_change(random_name: pd.DataFrame) -> pd.DataFrame:
    return random_name

def add_one(df: pd.DataFrame) -> pd.DataFrame:
    return df + 1

def add_param(df: pd.DataFrame, add_val: int) -> pd.DataFrame:
    return df + add_val

def add_col(df: pd.DataFrame) -> pd.DataFrame:
    df.insert(0, 'New Column', 0)
    return df

def del_col(df: pd.DataFrame) -> pd.DataFrame:
    return df.drop(df.columns[0], axis=1)

def rename_all_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = ['abc' + col for col in df.columns]
    return df


USER_DEFINED_IMPORT_TESTS = [
    (
        [
            START_DF
        ],
        "no_change",
        {
            'random_name': 'df1'
        },
        [
            START_DF
        ]
    ),
    (
        [
            START_DF
        ],
        "add_one",
        {
            'df': 'df1'
        },
        [
            START_DF + 1
        ]
    ),
    (
        [
            START_DF
        ],
        "add_param",
        {
            'df': 'df1',
            'add_val': '2'
        },
        [
            START_DF + 2
        ]
    ),
    (
        [
            START_DF
        ],
        "add_col",
        {
            'df': 'df1',
        },
        [
            ADDED_COL_DF
        ]
    ),
    (
        [
            START_DF
        ],
        "del_col",
        {
            'df': 'df1',
        },
        [
            START_DF.drop('A', axis=1)
        ]
    ),
    (
        [
            START_DF
        ],
        "rename_all_columns",
        {
            'df': 'df1',
        },
        [
            RENAMED_COL_DF
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, edit_name, edit_params, output_dfs", USER_DEFINED_IMPORT_TESTS)
def test_userdefinedimport(input_dfs, edit_name, edit_params, output_dfs):
    mito = create_mito_wrapper(*[df.copy(deep=True) for df in input_dfs], editors=[no_change, add_one, add_param, add_col, del_col, rename_all_columns])
    mito.user_defined_edit(edit_name, edit_params)

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)

# TODO: make sure we can do another edit after it

def no_params() -> pd.DataFrame:
    import pandas as pd
    df = pd.DataFrame({'A': [1]})
    return df

def wrong_first_param(df: int) -> pd.DataFrame:
    import pandas as pd
    return pd.DataFrame({'A': [1, 2, 3]})

from mitosheet.extensions.v1 import ColumnHeader
def unqualified_column_header(ch: ColumnHeader) -> pd.DataFrame:
    import pandas as pd
    return pd.DataFrame({'A': [1, 2, 3]})

def test_user_defined_edit_errors_with_no_params():
    with pytest.raises(ValueError) as e_info:
        create_mito_wrapper(editors=[no_params])
    
def test_user_defined_edit_errors_with_wrong_first_param_type():
    with pytest.raises(ValueError) as e_info:
        create_mito_wrapper(editors=[wrong_first_param])

def test_user_defined_edit_with_unqualified_column_header_errors():
    with pytest.raises(ValueError) as e_info:
        create_mito_wrapper(editors=[unqualified_column_header])

def test_user_defined_edit_optimizes():

    def editor(df: pd.DataFrame) -> pd.DataFrame:
        return df + 1
    
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, editors=[editor])
    mito.user_defined_edit('editor', {'df': 'df1'})
    assert mito.dfs[0].equals(df + 1)
    mito.delete_dataframe(0)

    assert len(mito.transpiled_code) == 0

def test_user_defined_edit_with_other_operation_around_it():

    def editor(df: pd.DataFrame) -> pd.DataFrame:
        return df + 1
    
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, editors=[editor])
    mito.add_column(0, 'B')
    mito.user_defined_edit('editor', {'df': 'df1'})
    mito.delete_columns(0, ['B'])
    assert mito.dfs[0].equals(df + 1)

def test_user_defined_edit_uses_column_header_not_column_id_in_tranpiled_code():

    def editor(df: pd.DataFrame, column: ColumnHeader) -> pd.DataFrame:
        df['D'] = column
        return df
    
    df = pd.DataFrame({'A': [1, 2, 3]})
    mito = create_mito_wrapper(df, editors=[editor])
    mito.add_column(0, 'B')
    mito.rename_column(0, 'B', 'C')
    mito.user_defined_edit('editor', {'df': 'df1', 'column': 'B'})
    assert "df1 = editor(df=df1, column='C')" in mito.transpiled_code
    assert mito.get_column(0, 'D', True) == ['C', 'C', 'C']


