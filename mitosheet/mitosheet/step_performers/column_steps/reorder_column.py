#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
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
    def step_display_name(cls) -> str:
        return 'Reordered Columns'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        sheet_index: int,
        column_id: ColumnID,
        new_column_index: int,
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:

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
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        sheet_index: int,
        column_id: ColumnID,
        new_column_index: int
    ) -> List[str]:
        column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)

        new_column_index = get_valid_index(prev_state.dfs, sheet_index, new_column_index)
        df_name = post_state.df_names[sheet_index]

        # Get columns in df
        columns_list_line = f'{df_name}_columns = [col for col in {df_name}.columns if col != {transpiled_column_header}]'

        # Insert column into correct location 
        insert_line = f'{df_name}_columns.insert({new_column_index}, {transpiled_column_header})'
        
        # Apply reorder line
        apply_reorder_line = f'{df_name} = {df_name}[{df_name}_columns]'

        return [columns_list_line, insert_line, apply_reorder_line]

    @classmethod
    def describe( # type: ignore
        cls,
        sheet_index: int,
        column_id: ColumnID,
        new_column_index: int,
        df_names=None,
        **params
    ) -> str:
        if df_names is not None:
            df_name = df_names[sheet_index]
            return f'Reordered {column_id} in {df_name}'
        return f'Reordered {column_id}'
    
    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        column_id: ColumnID,
        new_column_index: int,
        **params
    ) -> Set[int]:
        return {sheet_index}


def _execute_reorder_column(df: pd.DataFrame, column_header: ColumnHeader, new_column_index: int) -> pd.DataFrame:
    """
    Helper function for reordering a column in the dataframe
    """
    df_columns = [col for col in df.columns if col != column_header]
    df_columns.insert(new_column_index, column_header)
    return df[df_columns]
