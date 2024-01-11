#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.merge_code_chunk import \
    MergeCodeChunk
from mitosheet.errors import make_incompatible_merge_key_error
from mitosheet.state import DATAFRAME_SOURCE_MERGED, State
from mitosheet.step_performers.pivot import get_optional_code_to_replay_on_dataframe_creation
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import ColumnID, StepType
from mitosheet.utils import get_first_unused_dataframe_name

LOOKUP = 'lookup'
UNIQUE_IN_LEFT = 'unique in left'
UNIQUE_IN_RIGHT = 'unique in right'

class MergeStepPerformer(StepPerformer):
    """
    Allows you to merge two dataframes together.
    """

    @classmethod
    def step_version(cls) -> int:
        return 5

    @classmethod
    def step_type(cls) -> str:
        return 'merge'
    
    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any], previous_steps: List[StepType]) -> Dict[str, Any]:

        # Replay the edits on top of the merged dataframe
        optional_code, optional_code_chunk_names = get_optional_code_to_replay_on_dataframe_creation(previous_steps, params)
        params['optional_code'] = optional_code
        params['optional_code_chunk_names'] = optional_code_chunk_names

        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        destination_sheet_index: Optional[int] = get_param(params, 'destination_sheet_index')
        
        final_destination_sheet_index = destination_sheet_index if destination_sheet_index is not None else len(prev_state.dfs)

        new_df_name = get_first_unused_dataframe_name(prev_state.df_names, "df_merge") if destination_sheet_index is None else prev_state.df_names[destination_sheet_index]

        execution_data = {
            # NOTE: we return the final destination name so frontend merges can match on this execution data - it's not
            # actually used by the backend (which is kinda confusing and should be renamed)
            'destination_sheet_index': final_destination_sheet_index,
            'new_df_name': new_df_name,
        }

        try:
            return cls.execute_through_transpile(
                prev_state, 
                params, 
                execution_data,
                new_dataframe_params={
                    'df_source': DATAFRAME_SOURCE_MERGED,
                    'new_df_names': [new_df_name],
                    'overwrite': {
                        'sheet_index_to_overwrite': destination_sheet_index,
                        'attempt_to_save_filter_metadata': True
                    } if destination_sheet_index is not None else destination_sheet_index
                },
                optional_code=params.get('optional_code')
            )

        except ValueError:

            sheet_index_one: int = get_param(params, 'sheet_index_one')
            sheet_index_two: int = get_param(params, 'sheet_index_two')
            merge_key_column_ids: List[List[ColumnID]] = get_param(params, 'merge_key_column_ids')
            merge_keys_one = prev_state.column_ids.get_column_headers_by_ids(sheet_index_one, list(map(lambda x: x[0], merge_key_column_ids)))
            merge_keys_two = prev_state.column_ids.get_column_headers_by_ids(sheet_index_two, list(map(lambda x: x[1], merge_key_column_ids)))

            # If we get a value error from merging two incompatible columns, we go through and check 
            # to see which of the columns this is, so our error can be maximally informative
            for merge_key_one, merge_key_two in zip(merge_keys_one, merge_keys_two):
                merge_key_one_dtype = str(prev_state.dfs[sheet_index_one][merge_key_one].dtype)
                merge_key_two_dtype = str(prev_state.dfs[sheet_index_two][merge_key_two].dtype)

                if merge_key_one_dtype != merge_key_two_dtype:
                    raise make_incompatible_merge_key_error(
                        merge_key_one=merge_key_one, 
                        merge_key_one_dtype=merge_key_one_dtype,
                        merge_key_two=merge_key_two, 
                        merge_key_two_dtype=merge_key_two_dtype,
                        error_modal=False
                    )

            raise make_incompatible_merge_key_error(error_modal=False)


    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            MergeCodeChunk(
                prev_state, 
                get_param(params, 'how'),
                get_param(params, 'destination_sheet_index'),
                get_param(params, 'sheet_index_one'),
                get_param(params, 'sheet_index_two'),
                get_param(params, 'merge_key_column_ids'),
                get_param(params, 'selected_column_ids_one'),
                get_param(params, 'selected_column_ids_two'),
                get_param(execution_data if execution_data is not None else {}, 'new_df_name'),
                get_param(execution_data if execution_data is not None else {}, 'optional_code_that_successfully_executed')
            )
        ]
    
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        destination_sheet_index = get_param(params, 'destination_sheet_index')
        if destination_sheet_index is not None: # If editing an existing sheet, that is what is changed
            return {destination_sheet_index}
        return {-1}