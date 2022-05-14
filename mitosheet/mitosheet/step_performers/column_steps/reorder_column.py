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


def get_valid_index(dfs: List[pd.DataFrame], sheet_index: int, new_column_index: int) -> int:
    # make sure new_column_index is valid
    if new_column_index < 0:
        new_column_index = 0

    if new_column_index >= len(dfs[sheet_index].columns):
        new_column_index = len(dfs[sheet_index].columns) - 1

    return new_column_index


class ReorderColumnStepPerformer(StepPerformer):
    """""
    A reorder_column step, which allows you to move 
    a column to a different location in the df.
    """

    @classmethod
    def step_version(cls) -> int:
        return 2

    @classmethod
    def step_type(cls) -> str:
        return 'reorder_column'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        new_column_index: int = get_param(params, 'new_column_index')

        column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)

        new_column_index = get_valid_index(prev_state.dfs, sheet_index, new_column_index)
            
        # Create a new post state
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        # Actually execute the column reordering
        pandas_start_time = perf_counter()
        final_df = _execute_reorder_column(
            prev_state.dfs[sheet_index],
            column_header,
            new_column_index
        )
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
        return [
            ReorderColumnCodeChunk(prev_state, post_state, params, execution_data)
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}


def _execute_reorder_column(df: pd.DataFrame, column_header: ColumnHeader, new_column_index: int) -> pd.DataFrame:
    """
    Helper function for reordering a column in the dataframe
    """
    df_columns = [col for col in df.columns if col != column_header]
    df_columns.insert(new_column_index, column_header)
    return df[df_columns]
