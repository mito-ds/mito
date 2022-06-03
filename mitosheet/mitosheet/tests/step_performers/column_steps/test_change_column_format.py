#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for changing the format of a column.
"""
import pytest
import os
import pandas as pd

from mitosheet.tests.test_utils import create_mito_wrapper, create_mito_wrapper_dfs

TEST_FILE_PATHS = [
    'test_file.csv',
    'test_file1.csv'
]

def test_change_format_single():

    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1.2, 2.0, 3.0]}))
    mito.change_column_format(0, ['A'], {'type': 'percent'})

    assert mito.column_format_types[0]['A']['type'] == 'percent'


def test_change_format_multiple():

    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1.2, 2.0, 3.0], 'B': [1.2, 2.0, 3.0], 'C': [1.2, 2.0, 3.0], 'D': [1.2, 2.0, 3.0]}))
    mito.change_column_format(0, ['A', 'B', 'C', 'D'], {'type': 'percent'})
    
    assert mito.column_format_types[0]['A']['type'] == 'percent'
    assert mito.column_format_types[0]['B']['type'] == 'percent'
    assert mito.column_format_types[0]['C']['type'] == 'percent'
    assert mito.column_format_types[0]['D']['type'] == 'percent'

def test_adding_column_sets_default_format():

    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1.2, 2.0, 3.0]}))
    mito.add_column(0, 'C')
    
    assert mito.column_format_types[0]['C']['type'] == 'default'

def test_add_column_then_change_format():

    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1.2, 2.0, 3.0]}))
    mito.add_column(0, 'C')
    mito.change_column_format(0, ['C'], {'type': 'percent'})

    assert mito.column_format_types[0]['C']['type'] == 'percent'

def test_delete_column_deletes_column_format():

    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1.2, 2.0, 3.0], 'B': [1.2, 2.0, 3.0], 'C': [1.2, 2.0, 3.0], 'D': [1.2, 2.0, 3.0]}))
    mito.delete_columns(0, 'C')

    with pytest.raises(KeyError):
        assert mito.column_format_types[0]['C'] == None

def test_creates_default_format_types_on_simple_import():

    df = pd.DataFrame(data={'A': [1, 2, 3], 'B': [2, 3, 4]})
    df.to_csv(TEST_FILE_PATHS[0], index=False)

    # Create with no dataframes
    mito = create_mito_wrapper_dfs()
    # And then import just a test file
    mito.simple_import([TEST_FILE_PATHS[0]])

    assert mito.column_format_types[0]['A']['type'] == 'default' 
    assert mito.column_format_types[0]['B']['type'] == 'default' 

    mito.simple_import([TEST_FILE_PATHS[0]])

    assert mito.column_format_types[1]['A']['type'] == 'default' 
    assert mito.column_format_types[1]['B']['type'] == 'default' 

    # Remove the test file
    os.remove(TEST_FILE_PATHS[0])

def test_creates_default_format_types_on_pivot():

    df1 = pd.DataFrame(data={'A': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(0, ['A'], [], {'A': ['count']}, flatten_column_headers=True)

    assert mito.column_format_types[1]['A']['type'] == 'default' 
    assert mito.column_format_types[1]['A count']['type'] == 'default' 

def test_remove_format_types_on_sheet_delete():

    df1 = pd.DataFrame(data={'A': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df1)
    mito.pivot_sheet(0, ['A'], [], {'A': ['count']}, flatten_column_headers=True)

    mito.delete_dataframe(1)

    with pytest.raises(IndexError):   
        assert mito.column_format_types[1]['A']['type'] == None
        assert mito.column_format_types[1]['A count']['type'] == None


def test_changing_column_dtype_clears_formatting():

    df1 = pd.DataFrame(data={'A': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df1)
    mito.change_column_dtype(0, 'A', 'float')

    assert mito.column_format_types[0]['A']['type'] == 'default'


def test_change_format_copies_on_sheet_duplicate():

    mito = create_mito_wrapper_dfs(pd.DataFrame({'A': [1.2, 2.0, 3.0]}))
    mito.change_column_format(0, ['A'], {'type': 'percent'})
    mito.duplicate_dataframe(0)

    assert mito.column_format_types[1]['A']['type'] == 'percent'
