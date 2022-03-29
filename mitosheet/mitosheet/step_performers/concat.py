#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.state import DATAFRAME_SOURCE_CONCAT, State
from mitosheet.step_performers.step_performer import StepPerformer


class ConcatStepPerformer(StepPerformer):
    """
    Allows you to concatenate two or more dataframes together.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'concat'
    
    @classmethod
    def step_display_name(cls) -> str:
        return 'Concatenated Dataframes'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        join: str, # inner | outter
        ignore_index: bool,
        sheet_indexes: List[int],
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:

        post_state = prev_state.copy()

        to_concat = [post_state.dfs[sheet_index] for sheet_index in sheet_indexes]

        if len(to_concat) == 0:
            new_df = pd.DataFrame()
            pandas_processing_time = 0.0
        else:
            pandas_start_time = perf_counter()
            new_df = pd.concat(to_concat, join=join, ignore_index=ignore_index)
            pandas_processing_time = perf_counter() - pandas_start_time

        # Add this dataframe to the new post state
        post_state.add_df_to_state(new_df, DATAFRAME_SOURCE_CONCAT)

        return post_state, {
            'pandas_processing_time': pandas_processing_time
        }

    @classmethod
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        join: str, # inner | outter
        ignore_index: bool,
        sheet_indexes: List[int]
    ) -> List[str]:

        df_names_to_concat = [post_state.df_names[sheet_index] for sheet_index in sheet_indexes]
        df_new_name = post_state.df_names[len(post_state.dfs) - 1]

        if len(df_names_to_concat) == 0:
            return [f'{df_new_name} = pd.DataFrame()']
        else:
            return [
                f"{df_new_name} = pd.concat([{', '.join(df_names_to_concat)}], join=\'{join}\', ignore_index={ignore_index})"
            ]

    @classmethod
    def describe( # type: ignore
        cls,
        join: str, # inner | outter
        ignore_index: bool,
        sheet_indexes: List[int],
        df_names=None,
        **params
    ) -> str:
        if df_names is not None:
            df_names_to_concat = [df_names[sheet_index] for sheet_index in sheet_indexes]
            return f'Concated ' + ", ".join(df_names_to_concat)
        return f'Concated dataframes'
    
    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        join: str, # inner | outter
        ignore_index: bool,
        sheet_indexes: List[int],
    ) -> Set[int]:
        return {-1}
