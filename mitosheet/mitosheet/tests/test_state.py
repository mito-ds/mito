#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the state class
"""
from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, DATAFRAME_SOURCE_PASSED, State
import pandas as pd

def test_state_can_add_df_to_end():
    df = pd.DataFrame({'A': [123]})
    state = State([df])
    state.add_df_to_state(df, DATAFRAME_SOURCE_IMPORTED)
    for key, value in state.__dict__.items():
        if isinstance(value, list):
            assert len(value) == 2
    
    assert state.df_sources == [DATAFRAME_SOURCE_PASSED, DATAFRAME_SOURCE_IMPORTED]

def test_state_can_add_df_to_middle():
    df = pd.DataFrame({'A': [123]})
    state = State([df])
    state.add_df_to_state(df, DATAFRAME_SOURCE_IMPORTED, sheet_index=0)
    for key, value in state.__dict__.items():
        if isinstance(value, list):
            assert len(value) == 1
    
    assert state.df_sources == [DATAFRAME_SOURCE_IMPORTED]

