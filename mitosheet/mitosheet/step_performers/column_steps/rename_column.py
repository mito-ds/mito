#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from mitosheet.errors import make_column_exists_error
from mitosheet.evaluation_graph_utils import create_column_evaluation_graph
from mitosheet.parser import safe_replace
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code
from mitosheet.types import ColumnHeader, ColumnID


class RenameColumnStepPerformer(StepPerformer):
    """"
    A rename_column step, which allows you to rename a column
    in a dataframe.

    NOTE: this should only be called on dataframes that do
    not have multi-index headers!
    """

    @classmethod
    def step_version(cls) -> int:
        return 2

    @classmethod
    def step_type(cls) -> str:
        return 'rename_column' 

    @classmethod
    def step_display_name(cls) -> str:
        return 'Renamed a Column'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        sheet_index: int,
        column_id: ColumnID,
        new_column_header: str,
        level=None,
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:
        if new_column_header in prev_state.dfs[sheet_index].keys():
            raise make_column_exists_error(new_column_header)

        # If the user has deleted the column header entirely, this is very likely
        # a mistake and not something they meant to do... so we just don't make any edits
        # and don't throw an error
        if new_column_header == '':
            return prev_state, None

        # Create a new post state for this step
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        old_level_value, pandas_processing_time = rename_column_headers_in_state(
            post_state,
            sheet_index,
            column_id,
            new_column_header,
            level
        )

        return post_state, {
            'old_level_value': old_level_value,
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
        new_column_header: str,
        level=None
    ) -> List[str]:
        
        # Process the no-op if the header is empty
        if new_column_header == '':
            return []

        df_name = post_state.df_names[sheet_index]
        old_column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)

        transpiled_old_column_header = column_header_to_transpiled_code(old_column_header)
        transpiled_new_column_header = column_header_to_transpiled_code(new_column_header)
        rename_dict = "{" + f'{transpiled_old_column_header}: {transpiled_new_column_header}' + "}"

        rename_string = f'{df_name}.rename(columns={rename_dict}, inplace=True)'
        return [rename_string]

    @classmethod
    def describe( # type: ignore
        cls,
        sheet_index: int,
        column_id: ColumnID,
        new_column_header: str,
        level=None,
        df_names=None,
        **params
    ) -> str:
        if df_names is not None:
            df_name = df_names[sheet_index]
            return f'Renamed {column_id} to {new_column_header} in {df_name}'
        return f'Renamed {column_id} to {new_column_header}'
    
    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        column_id: ColumnID,
        new_column_header: str,
        level=None,
        **params
    ) -> Set[int]:
        return {sheet_index}


def rename_column_headers_in_state(
        post_state: State,
        sheet_index: int,
        column_id: ColumnID,
        new_column_header: ColumnHeader,
        level: Union[None, int]
    ) -> Tuple[Optional[ColumnHeader], float]:
    """
    A helper function for updating a column header in the state, which is useful
    for both this rename step and for the bulk rename step.
    """
    old_column_header = post_state.column_ids.get_column_header_by_id(sheet_index, column_id)

    # Save original column headers and eval graph, so we can use them below
    original_column_headers = list(post_state.dfs[sheet_index].keys())
    column_evaluation_graph = create_column_evaluation_graph(post_state, sheet_index)

    # If the level is not set, just do a simple rename
    post_state.dfs[sheet_index].rename(columns={old_column_header: new_column_header}, inplace=True)

    # We also have to go over _all_ the formulas in the sheet that reference this column, and update
    # their references to the new column. 
    for other_column_id in column_evaluation_graph[column_id]:
        old_formula = post_state.column_spreadsheet_code[sheet_index][other_column_id]
        # Update the formula
        post_state.column_spreadsheet_code[sheet_index][other_column_id] = safe_replace(
            old_formula,
            old_column_header,
            new_column_header,
            original_column_headers
        )

    # Update the column header
    pandas_start_time = perf_counter()
    post_state.column_ids.set_column_header(sheet_index, column_id, new_column_header)
    pandas_processing_time = perf_counter() - pandas_start_time
    
    return old_column_header, pandas_processing_time