#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Union

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.transpiler.transpile_utils import (
    column_header_list_to_transpiled_code, column_header_to_transpiled_code)
from mitosheet.types import ColumnID

# CONSTANTS USED IN THE SORT STEP ITSELF
ASCENDING = 'ascending'
DESCENDING = 'descending'

class DropDuplicatesStepPerformer(StepPerformer):
    """
    Allows you to drop duplicates from a dataframe
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'drop_duplicates'
    
    @classmethod
    def step_display_name(cls) -> str:
        return 'Dropped Duplicates'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        sheet_index: int,
        column_ids: List[ColumnID],
        keep: Union[str, bool],
        **params
    ):
        column_headers = [
            prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
            for column_id in column_ids
        ]

        # If the subset is none, then we don't actually do the drop, as there are no
        # duplicates between 0 columns
        if len(column_headers) == 0:
            return None

        # We make a new state to modify it
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        pandas_start_time = perf_counter()
        final_df = post_state.dfs[sheet_index].drop_duplicates(
            subset=column_headers,
            keep=keep
        )
        pandas_processing_time = perf_counter() - pandas_start_time

        post_state.dfs[sheet_index] = final_df

        return post_state, {
            'pandas_processing_time': pandas_processing_time
        }

    @classmethod
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        sheet_index: int,
        column_ids: List[ColumnID],
        keep: Union[str, bool],
    ) -> List[str]:

        column_headers = [
            prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
            for column_id in column_ids
        ]

        # If the subset is none, then we don't actually do the drop, as there are no
        # duplicates between 0 columns
        if len(column_headers) == 0:
            return []
        
        # We leave subset and keep empty if they are not used
        param_string = ''
        if len(column_headers) != len(post_state.dfs[sheet_index].keys()):
            param_string += 'subset=' + column_header_list_to_transpiled_code(column_headers) + ', '
        
        param_string += 'keep=' + column_header_to_transpiled_code(keep) # not a column header, but we can use the same utility

        df_name = post_state.df_names[sheet_index]

        return [
            f'{df_name} = {df_name}.drop_duplicates({param_string})'
        ]


    @classmethod
    def describe( # type: ignore
        cls,
        sheet_index: int,
        column_ids: List[ColumnID],
        keep: str,
        df_names=None,
        **params
    ) -> str:
        if df_names is not None:
            df_name = df_names[sheet_index]
            return f'Drop duplicates in {df_name}'
        return f'Drop duplicates'

    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        column_ids: List[ColumnID],
        keep: str,
        **params
    ) -> Set[int]:
        return {sheet_index}
