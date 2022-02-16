#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for dataframe_rename
"""

import pytest
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper_dfs
from mitosheet.transpiler.transpile import transpile


def test_can_rename_single_dataframe():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df)

    mito.rename_dataframe(0, 'df100')

    assert mito.df_names == ['df100']


def test_can_rename_multiple_dataframes():
    df1 = pd.DataFrame({'A': [123]})
    df2 = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df1, df2)

    mito.rename_dataframe(0, 'df100')
    mito.rename_dataframe(1, 'df101')

    assert mito.df_names == ['df100', 'df101']


def test_can_rename_overlapping_name():
    df1 = pd.DataFrame({'A': [123]})
    df2 = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df1, df2)

    mito.rename_dataframe(1, 'df1')

    assert mito.df_names == ['df1', 'df1_1']


def test_can_rename_no_change():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df)

    mito.rename_dataframe(0, 'df1')

    assert len(mito.transpiled_code) == 0


INVALID_NAME_TESTS = [
    ('df 100', 'df_100'),
    ('New Sheet', 'New_Sheet'),
    ('Marketing-Data', 'Marketing_Data'),
    ('Marketing-Data!', 'Marketing_Data'),
    ('This!Is!New', 'This_Is_New'),
]
@pytest.mark.parametrize("invalid_name, correct_name", INVALID_NAME_TESTS)
def test_rename_handles_invalid_names(invalid_name, correct_name): 
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df)

    mito.rename_dataframe(0, invalid_name)

    assert mito.transpiled_code == [
        f'{correct_name} = df1'
    ]