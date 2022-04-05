#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.errors import make_invalid_column_delete_error
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.evaluation_graph_utils import create_column_evaluation_graph, topological_sort_columns
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code
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
    def step_display_name(cls) -> str:
        return 'Deleted Column(s)'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        sheet_index: int,
        column_ids: List[ColumnID],
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:

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
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        sheet_index: int,
        column_ids: List[ColumnID]
    ) -> List[str]:

        df_name = post_state.df_names[sheet_index]
        column_headers_list_string = column_header_list_to_transpiled_code(
            [prev_state.column_ids.get_column_header_by_id(sheet_index, column_id) for column_id in column_ids]
        )

        return [f'{df_name}.drop({column_headers_list_string}, axis=1, inplace=True)']
    
    @classmethod
    def describe( # type: ignore
        cls,
        sheet_index: int,
        column_ids: List[ColumnID],
        df_names=None,
        **params
    ) -> str:
        formated_column_ids = (', '.join(column_ids))
        if df_names is not None:
            df_name = df_names[sheet_index]
            return f'Deleted column{"s" if len(column_ids) > 1 else ""} {formated_column_ids} from {df_name}'
        return f'Deleted column{"s" if len(column_ids) > 1 else ""} {formated_column_ids}'

    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        column_ids: List[ColumnID],
        **params
    ) -> Set[int]:
        return {sheet_index}

def delete_column_ids(
    state: State,
    sheet_index: int,
    column_ids: List[ColumnID],
) -> Tuple[State, float]:


    # First, we check that we can delete these columns, and error if we cannot
    if not set(column_ids).issubset(set(state.column_ids.get_column_ids_map(sheet_index).keys())):
        raise make_invalid_column_delete_error(column_ids)

    column_evaluation_graph = create_column_evaluation_graph(state, sheet_index)

    # Put the columns in a topological sorting so we delete columns that reference
    # other columns in column_ids first, in order to avoid make_invalid_column_delete_error
    topologicaly_sorted_column_ids = topological_sort_columns(column_evaluation_graph)
    sorted_column_ids_to_delete = list(filter(lambda column_id: column_id in column_ids, topologicaly_sorted_column_ids))
    sorted_column_ids_to_delete.reverse()

    # Delete each column one by one
    unable_to_delete_columns = []
    pandas_processing_time = 0.0
    for column_id in sorted_column_ids_to_delete:
        state, success, partial_pandas_processing_time = _delete_column_id(state, sheet_index, column_id)
        if not success:
            unable_to_delete_columns.append(column_id)
        pandas_processing_time += partial_pandas_processing_time

    # If we weren't able to delete any of the columns, then raise an error
    if len(unable_to_delete_columns) > 0:
        column_headers = [state.column_ids.get_column_header_by_id(sheet_index, column_id) for column_id in unable_to_delete_columns]
        dependant_columns_lists = [list(column_evaluation_graph[column_id]) for column_id in unable_to_delete_columns]
        # Flatten the list 
        dependant_columns = [item for sublist in dependant_columns_lists for item in sublist]
    
        raise make_invalid_column_delete_error(column_headers, dependant_columns)

    return state, pandas_processing_time


def _delete_column_id( 
    state: State,
    sheet_index: int,
    column_id: ColumnID
) -> Tuple[State, bool, float]:
    
    column_evaluation_graph = create_column_evaluation_graph(state, sheet_index)
    column_header = state.column_ids.get_column_header_by_id(sheet_index, column_id)

    # Return False if there are any columns that currently rely on this column, 
    # so we can display an error message with all of the un-deletable columns.
    if len(column_evaluation_graph[column_id]) > 0:
        return state, False, 0
        
    # Actually drop the column
    df = state.dfs[sheet_index]
    partial_pandas_start_time = perf_counter()
    df.drop(column_header, axis=1, inplace=True)
    partial_pandas_processing_time = perf_counter() - partial_pandas_start_time

    # And then update all the state variables removing this column from the state
    del state.column_spreadsheet_code[sheet_index][column_id]
    del state.column_format_types[sheet_index][column_id]

    # We also have to delete the places in the graph where this node is 
    for dependents in column_evaluation_graph.values():
        if column_id in dependents:
            dependents.remove(column_id)
    # Clean up the IDs
    state.column_ids.delete_column_id(sheet_index, column_id)
    
    return state, True, partial_pandas_processing_time
