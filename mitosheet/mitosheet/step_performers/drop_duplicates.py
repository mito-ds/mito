#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.drop_duplicates_code_chunk import DropDuplicatesCodeChunk

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param


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
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index = get_param(params, 'sheet_index')

        post_state, execution_data = cls.execute_through_transpile(prev_state, params)

        num_rows_dropped = len(prev_state.dfs[sheet_index].index) - len(post_state.dfs[sheet_index].index)

        return post_state, {
            **execution_data,
            'result': {
                'num_rows_dropped': num_rows_dropped
            }
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            DropDuplicatesCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'column_ids'),
                get_param(params, 'keep')
            )   
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
