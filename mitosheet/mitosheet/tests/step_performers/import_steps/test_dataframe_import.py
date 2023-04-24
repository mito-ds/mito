#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for Dataframe Import
"""

import pandas as pd
import pytest
from mitosheet.tests.test_utils import create_mito_wrapper

DATAFRAME_IMPORT_TESTS = [
    (
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ],
        [
            pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
        ]
    ),
]
@pytest.mark.parametrize("input_dfs, output_dfs", DATAFRAME_IMPORT_TESTS)
def test_dataframe_import(input_dfs, output_dfs):
    mito = create_mito_wrapper()
    test_df = input_dfs[0]
    mito.dataframe_import(['test_df'])

    assert len(mito.dfs) == len(output_dfs)
    for actual, expected in zip(mito.dfs, output_dfs):
        assert actual.equals(expected)

def test_import_multiple_dataframes():
    df1 = pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
    df2 = pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})

    mito = create_mito_wrapper()

    mito.dataframe_import(['df1', 'df2'])

    assert len(mito.dfs) == 2
    for actual, expected in zip(mito.dfs, [df1, df2]):
        assert actual.equals(expected)
        
def test_import_and_delete():
    df1 = pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
    df2 = pd.DataFrame({'A': [1, 2, 3], 'B': [1.0, 2.0, 3.0], 'C': [True, False, True], 'D': ["string", "with spaces", "and/!other@characters"], 'E': pd.to_datetime(['12-22-1997', '12-23-1997', '12-24-1997']), 'F': pd.to_timedelta(['1 days', '2 days', '3 days'])})
    df1.to_csv('test.csv', index=False)
    mito = create_mito_wrapper()

    mito.simple_import(['test.csv'])
    mito.dataframe_import(['df1'])

    assert len(mito.dfs) == 2

    # These tests
    try:
        mito.delete_dataframe(0)
    except:
        pass
    try:
        mito.delete_dataframe(0)
    except:
        pass

    assert len(mito.dfs) == 0


def test_import_same_dataframe_multiple_times():
    # TODO: note that this can do weird things in the sheet, due to copies that are made!
    # Do we want to handle this?
    pass