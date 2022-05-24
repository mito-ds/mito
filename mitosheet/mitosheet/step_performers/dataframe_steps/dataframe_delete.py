#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.dataframe_steps.dataframe_delete_code_chunk import DataframeDeleteCodeChunk

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param


class DataframeDeleteStepPerformer(StepPerformer):
    """
    Deletes a dataframe from everywhere in the step.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'dataframe_delete'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        sheet_index = params['sheet_index']
        old_dataframe_name = prev_state.df_names[sheet_index]
        params['old_dataframe_name'] = old_dataframe_name
        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        
        post_state = prev_state.copy()

        # Execute the delete
        post_state.column_ids.remove_df(sheet_index)
        post_state.column_spreadsheet_code.pop(sheet_index)
        post_state.column_filters.pop(sheet_index)
        post_state.column_format_types.pop(sheet_index)
        post_state.dfs.pop(sheet_index)
        post_state.df_names.pop(sheet_index)
        post_state.df_sources.pop(sheet_index)

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
            DataframeDeleteCodeChunk(
                prev_state, 
                post_state, 
                # Our dataframe delete code chunk can support mulitple dataframes being deleted
                # at once, so we turn it into this format
                {
                    'sheet_indexes': [params['sheet_index']],
                    'old_dataframe_names': [params['old_dataframe_name']],
                }, 
                execution_data
            )
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return set() # Redo all of them, as order shifts
