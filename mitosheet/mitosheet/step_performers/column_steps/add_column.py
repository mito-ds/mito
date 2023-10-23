#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.column_steps.add_column_code_chunk import AddColumnCodeChunk

from mitosheet.errors import make_column_exists_error, make_no_sheet_error
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.column_headers import get_column_header_id


class AddColumnStepPerformer(StepPerformer):
    """""
    A add_column step, which allows you to add a column to 
    a dataframe. 
    """

    @classmethod
    def step_version(cls) -> int:
        return 2

    @classmethod
    def step_type(cls) -> str:
        return 'add_column'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_header: str = get_param(params, 'column_header')
        column_header_index: int = get_param(params, 'column_header_index')

        # If the column_header_index is out of range, then make the new column the last column
        if column_header_index < 0 or len(prev_state.dfs[sheet_index].columns) <= column_header_index:
            column_header_index = len(prev_state.dfs[sheet_index].columns)

        new_column_id = get_column_header_id(column_header)

        execution_data = {
            'column_header_index': column_header_index,
            'new_column_id': new_column_id
        }

        return cls.execute_through_transpile(
            prev_state,
            params,
            execution_data,
            column_headers_to_column_ids={column_header: new_column_id}
        )

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            AddColumnCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),    
                get_param(params, 'column_header'),
                execution_data.get('column_header_index', 0) if execution_data is not None else 0,
                execution_data.get('new_column_id', '') if execution_data is not None else '',
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}