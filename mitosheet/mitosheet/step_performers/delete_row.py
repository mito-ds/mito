
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.delete_row_code_chunk import DeleteRowCodeChunk

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID

class DeleteRowStepPerformer(StepPerformer):
    """
    Allows you to delete a row.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'delete_row'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        labels: List[Any] = get_param(params, 'labels')
        
        # We make a new state to modify it
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        pandas_start_time = perf_counter()

        post_state.dfs[sheet_index].drop(labels=labels, inplace=True)

        pandas_processing_time = perf_counter() - pandas_start_time


        return post_state, {
            'pandas_processing_time': pandas_processing_time,
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
            DeleteRowCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'labels')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
    