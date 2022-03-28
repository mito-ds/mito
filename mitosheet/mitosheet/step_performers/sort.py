#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.errors import (
    make_invalid_sort_error
)
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code
from mitosheet.types import ColumnID

# CONSTANTS USED IN THE SORT STEP ITSELF
ASCENDING = 'ascending'
DESCENDING = 'descending'

class SortStepPerformer(StepPerformer):
    """
    Allows you to sort a df based on key column, in either
    ascending or descending order.
    """

    @classmethod
    def step_version(cls) -> int:
        return 2

    @classmethod
    def step_type(cls) -> str:
        return 'sort'
    
    @classmethod
    def step_display_name(cls) -> str:
        return 'Sorted a Column'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        sheet_index: int,
        column_id: ColumnID,
        sort_direction: str,
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:
        """
        Returns the new new post state after sorting the sheet
        at `sheet_index` by the passed `column_id` in the given
        `sort_direction`
        """

        column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)

        # We make a new state to modify it
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        try: 
            pandas_start_time = perf_counter()
            new_df = prev_state.dfs[sheet_index].sort_values(by=column_header, ascending=(sort_direction == ASCENDING), na_position=('first' if sort_direction == ASCENDING else 'last'))
            pandas_processing_time = perf_counter() - pandas_start_time
            post_state.dfs[sheet_index] = new_df
        except TypeError as e:
            # A NameError occurs when you try to sort a column with incomparable 
            # dtypes (ie: a column with strings and floats)
            print(e)
            # Generate an error informing the user
            raise make_invalid_sort_error(column_header)

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
        sort_direction: str
    ) -> List[str]:
        df_name = post_state.df_names[sheet_index]
        column_header = post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)
        
        na_position_string = 'first' if sort_direction == ASCENDING else 'last'
        
        return [
            f'{df_name} = {df_name}.sort_values(by={transpiled_column_header}, ascending={sort_direction == ASCENDING}, na_position=\'{na_position_string}\')', 
        ]

    @classmethod
    def describe( # type: ignore
        cls,
        sheet_index: int,
        column_id: ColumnID,
        sort_direction: str,
        df_names=None,
        **params
    ) -> str:
        if df_names is not None:
            df_name = df_names[sheet_index]
            return f'Sorted {column_id} in {df_name} in {sort_direction} order'
        return f'Sorted {column_id} in {sort_direction} order'

    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        column_id: ColumnID,
        sort_direction: str,
        **params
    ) -> Set[int]:
        return {sheet_index}