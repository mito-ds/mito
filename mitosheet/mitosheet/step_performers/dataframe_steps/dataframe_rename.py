#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.dataframe_steps.dataframe_rename_code_chunk import DataframeRenameCodeChunk

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.utils import get_valid_dataframe_name


class DataframeRenameStepPerformer(StepPerformer):
    """"
    A rename dataframe step changes the name of a specific dataframe
    at a specific index.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'dataframe_rename'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        sheet_index = params['sheet_index']
        old_dataframe_name = prev_state.df_names[sheet_index]
        params['old_dataframe_name'] = old_dataframe_name
        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        old_dataframe_name: str = get_param(params, 'old_dataframe_name')
        new_dataframe_name: str = get_param(params, 'new_dataframe_name')

        # Bail early, if there is no change
        if old_dataframe_name == new_dataframe_name:
            return prev_state, None

        # Create a new step and save the parameters
        post_state = prev_state.copy()

        post_state.df_names[sheet_index] = get_valid_dataframe_name(post_state.df_names, new_dataframe_name)

        return post_state, {
            'pandas_processing_time': 0 # No time spent on pandas, only metadata changes
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            DataframeRenameCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'sheet_index'), 
                get_param(params, 'old_dataframe_name'),
                get_param(params, 'new_dataframe_name')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')} # This should be none, but we don't have a way to return that