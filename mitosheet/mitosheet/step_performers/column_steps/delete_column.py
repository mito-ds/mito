#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.column_steps.delete_column_code_chunk import \
    DeleteColumnsCodeChunk
from mitosheet.errors import raise_error_if_column_ids_do_not_exist
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID


class DeleteColumnStepPerformer(StepPerformer):
    """"
    A delete_column step, which allows you to delete a column
    from a dataframe.
    """
    @classmethod
    def step_version(cls) -> int:
        return 3

    @classmethod
    def step_type(cls) -> str:
        return 'delete_column'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_ids: List[ColumnID] = get_param(params, 'column_ids')

        raise_error_if_column_ids_do_not_exist(
            'delete column',
            prev_state,
            sheet_index,
            column_ids
        )

        # Make a post state, that is a deep copy
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        # Actually delete the columns and update state
        post_state, pandas_processing_time = delete_column_ids(post_state, sheet_index, column_ids)

        return post_state, {
            # Add the num_cols_deleted to the execution data for logging purposes. 
            'num_cols_deleted': len(column_ids),
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
            DeleteColumnsCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'sheet_index'), 
                get_param(params, 'column_ids'), 
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}

def delete_column_ids(
    state: State,
    sheet_index: int,
    column_ids: List[ColumnID],
) -> Tuple[State, float]:

    # Delete each column one by one
    pandas_processing_time = 0.0
    for column_id in column_ids:
        state, partial_pandas_processing_time = _delete_column_id(state, sheet_index, column_id)
        pandas_processing_time += partial_pandas_processing_time

    return state, pandas_processing_time


def _delete_column_id( 
    state: State,
    sheet_index: int,
    column_id: ColumnID
) -> Tuple[State, float]:
    
    column_header = state.column_ids.get_column_header_by_id(sheet_index, column_id)
        
    # Actually drop the column
    df = state.dfs[sheet_index]
    partial_pandas_start_time = perf_counter()
    df.drop(column_header, axis=1, inplace=True)
    partial_pandas_processing_time = perf_counter() - partial_pandas_start_time

    # And then update all the state variables removing this column from the state
    del state.column_formulas[sheet_index][column_id]
    if column_id in state.df_formats[sheet_index]['columns']:
        del state.df_formats[sheet_index]['columns'][column_id]

    # Clean up the IDs
    state.column_ids.delete_column_id(sheet_index, column_id)
    
    return state, partial_pandas_processing_time
