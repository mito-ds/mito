#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer


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
    def step_display_name(cls) -> str:
        return 'Deleted a Dataframe'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        sheet_index = params['sheet_index']
        old_dataframe_name = prev_state.df_names[sheet_index]
        params['old_dataframe_name'] = old_dataframe_name
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        sheet_index: int,
        old_dataframe_name: str,
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:
        # Create a new step and save the parameters
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
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        sheet_index: int,
        old_dataframe_name: str
    ) -> List[str]:
        return [f'del {old_dataframe_name}']

    @classmethod
    def describe( # type: ignore
        cls,
        sheet_index: int,
        old_dataframe_name: str,
        df_names=None,
        **params
    ) -> str:
        return f'Deleted dataframe {old_dataframe_name}'
    
    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        old_dataframe_name: str,
        **params
    ) -> Set[int]:
        return set() # Redo all of them, as order shifts
