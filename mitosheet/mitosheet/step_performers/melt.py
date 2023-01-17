
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.melt_code_chunk import MeltCodeChunk

from mitosheet.state import DATAFRAME_SOURCE_MELTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID
from mitosheet.utils import get_first_unused_dataframe_name

class MeltStepPerformer(StepPerformer):
    """
    Allows you to melt.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'melt'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        id_var_column_ids: List[ColumnID] = get_param(params, 'id_var_column_ids')
        value_var_column_ids: List[ColumnID] = get_param(params, 'value_var_column_ids')

        id_vars = prev_state.column_ids.get_column_headers_by_ids(sheet_index, id_var_column_ids)
        value_vars = prev_state.column_ids.get_column_headers_by_ids(sheet_index, value_var_column_ids)

        # We remove all id vars from value vars, as in earlier versions of pandas overlap causes
        # errors that we don't want
        value_vars = list(filter(lambda value_var: value_var not in id_vars, value_vars))

        # We make a new state to modify it
        post_state = prev_state.copy() 

        params = {
            'id_vars': id_vars
        }

        # If we're not including any headers that wouldn't be included by default, then we can 
        # just leave the value_vars empty
        include_value_vars = not set(post_state.dfs[sheet_index].columns).difference(id_vars).issubset(value_vars)
        if include_value_vars:
            params['value_vars'] = value_vars

        pandas_start_time = perf_counter()
        new_df = post_state.dfs[sheet_index].melt(**params)
        pandas_processing_time = perf_counter() - pandas_start_time

        new_df_name = get_first_unused_dataframe_name(post_state.df_names, f'{post_state.df_names[sheet_index]}_unpivoted')
        post_state.add_df_to_state(new_df, DATAFRAME_SOURCE_MELTED, df_name=new_df_name)

        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'include_value_vars': include_value_vars
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
            MeltCodeChunk(
                prev_state,
                post_state,
                get_param(params, 'sheet_index'),
                get_param(params, 'id_var_column_ids'),
                get_param(params, 'value_var_column_ids'),
                get_param(execution_data if execution_data is not None else {}, 'include_value_vars'),
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
    