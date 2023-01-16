
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.export_to_file_code_chunk import ExportToFileCodeChunk

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID

class ExportToFileStepPerformer(StepPerformer):
    """
    Allows you to export to file.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'export_to_file'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        _type: str = get_param(params, 'type')
        sheet_indexes: List[int] = get_param(params, 'sheet_indexes')
        file_name: str = get_param(params, 'file_name')

        # TODO: do we actually want this to do anything?
        
        # We make a new state to modify it
        post_state = prev_state.copy() # TODO: update the deep copies

        pandas_start_time = perf_counter()
        
        # TODO: do the operation here

        pandas_processing_time = perf_counter() - pandas_start_time


        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'result': {
                # TODO: fill in the result
            }
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
            ExportToFileCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'type'),
                get_param(params, 'sheet_indexes'),
                get_param(params, 'file_name'),
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {}
    