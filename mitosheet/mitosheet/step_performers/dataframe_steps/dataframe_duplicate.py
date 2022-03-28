#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.state import DATAFRAME_SOURCE_DUPLICATED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.utils import get_first_unused_dataframe_name


class DataframeDuplicateStepPerformer(StepPerformer):
    """
    This steps duplicates a dataframe of a given index. 
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'dataframe_duplicate'

    @classmethod
    def step_display_name(cls) -> str:
        return 'Duplicated a Dataframe'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        sheet_index: int,
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:
        post_state = prev_state.copy()

        # Execute the step
        pandas_start_time = perf_counter()
        df_copy = post_state.dfs[sheet_index].copy(deep=True)
        pandas_processing_time = perf_counter() - pandas_start_time
        new_name = get_first_unused_dataframe_name(post_state.df_names, post_state.df_names[sheet_index] + '_copy')
        # Copy the formatting to the new sheet
        format_types = post_state.column_format_types[sheet_index].copy()
        post_state.add_df_to_state(df_copy, DATAFRAME_SOURCE_DUPLICATED, df_name=new_name, format_types=format_types)

        return post_state, {
            'pandas_processing_time': pandas_processing_time
        }

    @classmethod
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        sheet_index: int
    ) -> List[str]:
        old_df_name = post_state.df_names[sheet_index]
        new_df_name = post_state.df_names[len(post_state.dfs) - 1]

        return [f'{new_df_name} = {old_df_name}.copy(deep=True)']

    @classmethod
    def describe( # type: ignore
        cls,
        sheet_index: int,
        df_names=None,
        **params
    ) -> str:
        if df_names is not None:
            old_df_name = df_names[sheet_index]
            new_df_name = df_names[len(df_names) - 1]
            return f'Duplicated {old_df_name} to {new_df_name}'
        return f'Duplicated a df'
    
    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        **params
    ) -> Set[int]:
        return {-1}
