#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.column_steps.reorder_column_code_chunk import ReorderColumnCodeChunk
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code
from mitosheet.types import ColumnHeader, ColumnID


class SplitTextToColumnsStepPerformer(StepPerformer):
    """""
    A split_text_to_columns step, which allows you to separate 
    a single column into multiple columns by specifying a delimiter
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'split_text_to_columns'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        delimiters: int = get_param(params, 'delimiters')

        column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        column_id_index = prev_state.column_ids.get_column_ids(sheet_index).index(column_id)
            
        # Create a new post state
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])
        final_df = prev_state.dfs[sheet_index]
        delimiter_string = '|'.join(delimiters)

        # Actually execute the column reordering
        pandas_start_time = perf_counter() 
        final_df[sheet_index] = final_df[column_id].str.split(delimiter_string, -1, expand=True)
        #final_df.columns = final_df.columns[:column_id_index].tolist() + {new_column_headers} + final_df.columns[{column_id_index}:{-{len(new_columns)}].tolist()

        pandas_processing_time = perf_counter() - pandas_start_time

        post_state.dfs[sheet_index] = final_df

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
        return []
    
    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        column_id: ColumnID,
        new_column_index: int,
        **params
    ) -> Set[int]:
        return {sheet_index}
