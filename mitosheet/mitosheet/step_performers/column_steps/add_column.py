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
from mitosheet.state import FORMAT_DEFAULT, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code


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
            
        # if the sheet doesn't exist, throw an error
        if not prev_state.does_sheet_index_exist_within_state(sheet_index):
            raise make_no_sheet_error({sheet_index})

        if column_header in prev_state.dfs[sheet_index].keys():
            raise make_column_exists_error(column_header)

        # We add a new step with the added column
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        # If the column_header_index is out of range, then make the new column the last column
        if column_header_index < 0 or len(prev_state.dfs[sheet_index].columns) <= column_header_index:
            column_header_index = len(prev_state.dfs[sheet_index].columns)

        # Update the state variables
        column_id = post_state.column_ids.add_column_header(sheet_index, column_header)
        post_state.column_spreadsheet_code[sheet_index][column_id] = '=0'
        post_state.column_filters[sheet_index][column_id] = {'operator': 'And', 'filters': []}
        post_state.column_format_types[sheet_index][column_id] = {'type': FORMAT_DEFAULT}
            
        # Update the dataframe
        pandas_start_time = perf_counter()
        post_state.dfs[sheet_index].insert(column_header_index, column_header, 0)
        pandas_processing_time = perf_counter() - pandas_start_time
        
        return post_state, {
            'column_header_index': column_header_index,
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
            AddColumnCodeChunk(prev_state, post_state, params, execution_data)
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}