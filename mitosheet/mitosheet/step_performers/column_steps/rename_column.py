#!/usr/bin/env python
# coding: utf8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

from copy import deepcopy
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from mitosheet.errors import make_column_exists_error
from mitosheet.parser import safe_replace
from mitosheet.state import State
from mitosheet.step_performers.column_steps.set_column_formula import \
    _update_column_formula_in_step
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
    def step_event_type(cls) -> str:
        return 'rename_column_edit'

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
        post_state = deepcopy(prev_state)

        old_level_value = rename_column_headers_in_state(
            post_state,
            sheet_index,
            column_id,
            new_column_header,
            level
        )

        return post_state, {
            'old_level_value': old_level_value
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

        if level is not None:
            transpiled_old_value = column_header_to_transpiled_code(execution_data['old_level_value'] if execution_data else '')
            transpiled_new_value = column_header_to_transpiled_code(new_column_header)
            rename_dict = "{" + f'{transpiled_old_value}: {transpiled_new_value}' + "}"
        else:
            transpiled_old_column_header = column_header_to_transpiled_code(old_column_header)
            transpiled_new_column_header = column_header_to_transpiled_code(new_column_header)
            rename_dict = "{" + f'{transpiled_old_column_header}: {transpiled_new_column_header}' + "}"

        partial_rename_string = f'{df_name}.rename(columns={rename_dict}, inplace=True'
        if level is not None:
            partial_rename_string += f', level={level}'
        partial_rename_string += ')'
        
        return [partial_rename_string]

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
        if level is None:
            if df_names is not None:
                df_name = df_names[sheet_index]
                return f'Renamed {column_id} to {new_column_header} in {df_name}'
            return f'Renamed {column_id} to {new_column_header}'
        else:
            return f'Renamed header at level {level} to {new_column_header}'
    
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
    ) -> Optional[ColumnHeader]:
    """
    A helper function for updating a column header in the state, which is useful
    for both this rename step and for the bulk rename step.
    """
    old_column_header = post_state.column_ids.get_column_header_by_id(sheet_index, column_id)

    # Save original column headers, so we can use them below
    original_column_headers = list(post_state.dfs[sheet_index].keys())

    # The (column_id, old_header, new_header) we need to update in the state as a result of the rename
    old_new_column_headers_to_update: Set[Tuple[str, Any, Any]] = set()

    if level is not None:
        if not isinstance(old_column_header, tuple) and not isinstance(old_column_header, list):
            raise ValueError(f'Error, cannot set level {level} on column header {old_column_header}')

        # If we have a level set, do the rename on the level value, rather than the column header
        # so that it matches the specific value in the dataframe
        old_level_value = old_column_header[level]
        post_state.dfs[sheet_index].rename(columns={old_level_value: new_column_header}, inplace=True, level=level)

        # If the level is non empty, then we need to go through and actually update
        # a bunch of headers
        for _old_column_header, _new_column_header in zip(original_column_headers, post_state.dfs[sheet_index].keys()):
            if _old_column_header != _new_column_header:
                _column_id = post_state.column_ids.get_column_id_by_header(sheet_index, _old_column_header)
                old_new_column_headers_to_update.add((
                    _column_id, _old_column_header, _new_column_header
                ))

    else:
        old_level_value = None
        # If the level is not set, just do a simple rename
        post_state.dfs[sheet_index].rename(columns={old_column_header: new_column_header}, inplace=True)
        # We only need to update the one header that was renamed
        old_new_column_headers_to_update.add((column_id, old_column_header, new_column_header))

    # Fix the column Python code, for this column
    for (column_id, old_column_header, new_column_header) in old_new_column_headers_to_update:
        transpiled_old_column_header = column_header_to_transpiled_code(old_column_header)
        transpiled_new_column_header = column_header_to_transpiled_code(new_column_header)
        post_state.column_python_code[sheet_index][column_id] = post_state.column_python_code[sheet_index][column_id].replace(
            f'df[{transpiled_old_column_header}]',
            f'df[{transpiled_new_column_header}]'
        )

        # We also have to go over _all_ the formulas in the sheet that reference this column, and update
        # their references to the new column. 
        for other_column_id in post_state.column_evaluation_graph[sheet_index][column_id]:
            old_formula = post_state.column_spreadsheet_code[sheet_index][other_column_id]
            new_formula = safe_replace(
                old_formula,
                old_column_header,
                new_column_header,
                original_column_headers
            )
            _update_column_formula_in_step(
                post_state, 
                sheet_index, 
                other_column_id, 
                old_formula, 
                new_formula,
                update_from_rename=True
            )

        # Update the column header
        post_state.column_ids.set_column_header(sheet_index, column_id, new_column_header)
    
    return old_level_value