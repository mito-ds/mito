#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for dataframe_delete
"""
import pandas as pd
from mitosheet.code_chunks.code_chunk_utils import get_code_chunks

from mitosheet.step_performers.dataframe_steps.dataframe_delete import DataframeDeleteStepPerformer
from mitosheet.column_headers import ColumnIDMap
from mitosheet.tests.test_utils import create_mito_wrapper

def test_can_delete_single_dataframe():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df)
    mito.delete_dataframe(0)

    curr_step = mito.curr_step
    for key, value in curr_step.__dict__.items():
        # Check we have deleted from all the lists
        if isinstance(value, list):
            assert len(value) == 0

    assert mito.transpiled_code == []


def test_can_delete_then_add_to_other_sheet():
    df1 = pd.DataFrame({'A': [123]})
    df2 = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df1, df2)
    mito.delete_dataframe(0)
    mito.add_column(0, 'B')

    assert len(mito.dfs) == 1

    assert mito.transpiled_code == [
        'from mitosheet.public.v3 import *', 
        '',
        'df2[\'B\'] = 0',
        '',
    ]



def test_can_delete_middle_of_multiple_dfs():
    df1 = pd.DataFrame({'A': [123]})
    df2 = pd.DataFrame({'B': [123]})
    df3 = pd.DataFrame({'C': [123]})
    mito = create_mito_wrapper(df1, df2, df3)
    
    deleted = mito.delete_dataframe(1)
    assert deleted

    curr_step = mito.curr_step
    assert curr_step.step_type == DataframeDeleteStepPerformer.step_type()
    for key, value in curr_step.__dict__.items():
        # Check we have deleted from all the lists
        if isinstance(value, list):
            assert len(value) == 2
        elif isinstance(value, ColumnIDMap):
            assert len(value.column_header_to_column_id) == 2
            assert len(value.column_id_to_column_header) == 2

    assert mito.transpiled_code == []


def test_can_delete_mulitple_dataframe():
    df = pd.DataFrame({'A': [123]})
    df1 = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df, df1)
    mito.delete_dataframe(0)
    mito.delete_dataframe(0)

    curr_step = mito.curr_step
    for key, value in curr_step.__dict__.items():
        # Check we have deleted from all the lists
        if isinstance(value, list):
            assert len(value) == 0

    assert mito.transpiled_code == []

def test_can_delete_mulitple_dataframe_more():
    df = pd.DataFrame({'A': [123]})
    df1 = pd.DataFrame({'A': [123]})
    df2 = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df, df1, df2)
    mito.delete_dataframe(0)
    mito.delete_dataframe(1)

    curr_step = mito.curr_step
    for key, value in curr_step.__dict__.items():
        # Check we have deleted from all the lists
        if isinstance(value, list):
            assert len(value) == 0

    assert mito.transpiled_code == []

    # We also check that it adjusted the sheet indexes internally correct
    assert mito.optimized_code_chunks[-1].__dict__['sheet_indexes'] == [0, 2]

def test_delete_multi_combines_correctly():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper(df, df, df, df, df, df, df, df)
    mito.delete_dataframe(0)
    mito.delete_dataframe(1)
    mito.delete_dataframe(0)
    mito.delete_dataframe(4)

    assert mito.transpiled_code == []

    # We also check that it adjusted the sheet indexes internally correct
    assert mito.optimized_code_chunks[-1].__dict__['sheet_indexes'] == [0, 2, 1, 7]
