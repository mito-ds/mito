#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy, deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.dataframe_steps.dataframe_duplicate_code_chunk import DataframeDuplicateCodeChunk
from mitosheet.column_headers import get_column_header_id

from mitosheet.state import DATAFRAME_SOURCE_DUPLICATED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
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
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')

        post_state = prev_state.copy()

        # Execute the step
        pandas_start_time = perf_counter()
        df_copy = post_state.dfs[sheet_index].copy(deep=True)
        pandas_processing_time = perf_counter() - pandas_start_time
        new_name = get_first_unused_dataframe_name(post_state.df_names, post_state.df_names[sheet_index] + '_copy')

        # Copy the formatting to the new sheet. Because the mapping is column id -> format object, and
        # the column ids that are created for the df_copy in the add_df_to_state function might be different
        # than the column_ids created initially (e.g. because of renames), we have to go through and updated
        # the mapping with the new column ids that the format types must rely on
        old_df_format = post_state.df_formats[sheet_index]
        new_df_format = deepcopy(post_state.df_formats[sheet_index])
        for old_column_id, column_header in post_state.column_ids.get_column_ids_map(sheet_index).items():
            new_column_id = get_column_header_id(column_header)
            old_column_format = old_df_format['columns'].get(old_column_id, None)
            if old_column_format is not None:
                del new_df_format['columns'][old_column_id]
                new_df_format['columns'][new_column_id] = old_column_format

        post_state.add_df_to_state(df_copy, DATAFRAME_SOURCE_DUPLICATED, df_name=new_name, df_format=new_df_format)

        return post_state, {
            'pandas_processing_time': pandas_processing_time
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
            DataframeDuplicateCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'sheet_index')
            )
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
