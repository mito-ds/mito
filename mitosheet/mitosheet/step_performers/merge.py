#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.merge_code_chunk import MergeCodeChunk
from mitosheet.errors import (make_incompatible_merge_headers_error,
                              make_incompatible_merge_key_error)
from mitosheet.state import DATAFRAME_SOURCE_MERGED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.transpiler.transpile_utils import (
    column_header_list_to_transpiled_code, column_header_to_transpiled_code)
from mitosheet.types import ColumnHeader, ColumnID

LOOKUP = 'lookup'
UNIQUE_IN_LEFT = 'unique in left'
UNIQUE_IN_RIGHT = 'unique in right'

class MergeStepPerformer(StepPerformer):
    """
    Allows you to merge two dataframes together.
    """

    @classmethod
    def step_version(cls) -> int:
        return 3

    @classmethod
    def step_type(cls) -> str:
        return 'merge'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        how = get_param(params, 'how')
        sheet_index_one = get_param(params, 'sheet_index_one')
        merge_key_column_id_one = get_param(params, 'merge_key_column_id_one')
        selected_column_ids_one = get_param(params, 'selected_column_ids_one')
        sheet_index_two = get_param(params, 'sheet_index_two')
        merge_key_column_id_two = get_param(params, 'merge_key_column_id_two')
        selected_column_ids_two = get_param(params, 'selected_column_ids_two')

        merge_key_one = prev_state.column_ids.get_column_header_by_id(sheet_index_one, merge_key_column_id_one)
        merge_key_two = prev_state.column_ids.get_column_header_by_id(sheet_index_two, merge_key_column_id_two)

        selected_columns_one = prev_state.column_ids.get_column_headers_by_ids(sheet_index_one, selected_column_ids_one)
        selected_columns_two = prev_state.column_ids.get_column_headers_by_ids(sheet_index_two, selected_column_ids_two)

        # We create a shallow copy to make the new post state
        post_state = prev_state.copy()

        pandas_start_time = perf_counter()
        new_df = _execute_merge(
            prev_state.dfs,
            prev_state.df_names,
            how,
            sheet_index_one,
            merge_key_one,
            selected_columns_one,
            sheet_index_two,
            merge_key_two,
            selected_columns_two
        )
        pandas_processing_time = perf_counter() - pandas_start_time

        # Add this dataframe to the new post state
        post_state.add_df_to_state(new_df, DATAFRAME_SOURCE_MERGED)

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
            MergeCodeChunk(prev_state, post_state, params, execution_data)
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}

def _execute_merge(
        dfs: List[pd.DataFrame], 
        df_names: List[str],
        how: str,
        sheet_index_one: int,
        merge_key_one: ColumnHeader, 
        selected_columns_one: List[ColumnHeader],
        sheet_index_two: int,
        merge_key_two: ColumnHeader,
        selected_columns_two: List[ColumnHeader]
    ) -> pd.DataFrame:
    """
    Executes a merge on the sheets with the given indexes, merging on the 
    given keys, and only keeping the selection columns from each df.
    """
    # We currently error if you try and merge two dataframes where they
    # have different levels to the multi-index in the column headers. Aka, 
    # you cannot merge a multi-index dataframe into a regular dataframe
    if dfs[sheet_index_one].columns.nlevels != dfs[sheet_index_two].columns.nlevels:
        raise make_incompatible_merge_headers_error(error_modal=False)

    if how == 'lookup':
        # We drop duplicates to avoid pairwise duplication on the merge.
        temp_df = dfs[sheet_index_two].drop_duplicates(subset=merge_key_two)
        # We overwrite the how variable to 'left' so it can be used in the merge
        how_to_use = 'left'
    else:
        temp_df = dfs[sheet_index_two]
        how_to_use = how

    # Then we delete all the columns from each we don't wanna keep
    deleted_columns_one = set(dfs[sheet_index_one].keys()).difference(set(selected_columns_one))
    deleted_columns_two = set(dfs[sheet_index_two].keys()).difference(set(selected_columns_two))

    df_one_cleaned = dfs[sheet_index_one].drop(deleted_columns_one, axis=1)
    df_two_cleaned = temp_df.drop(deleted_columns_two, axis=1)

    # Finially, we perform the merge!
    df_one_name = df_names[sheet_index_one]
    df_two_name = df_names[sheet_index_two]
    # We make sure the suffixes aren't the same, as otherwise we might end up with 
    # one df with duplicated column headers
    suffix_one = df_one_name
    suffix_two = df_two_name if df_two_name != df_one_name else f'{df_two_name}_2'

    try:
        if how == UNIQUE_IN_LEFT:
            return df_one_cleaned.copy(deep=True)[~df_one_cleaned[merge_key_one].isin(df_two_cleaned[merge_key_two])]
        if how == UNIQUE_IN_RIGHT:
            return df_two_cleaned.copy(deep=True)[~df_two_cleaned[merge_key_two].isin(df_one_cleaned[merge_key_one])]
        else:
            return df_one_cleaned.merge(df_two_cleaned, left_on=[merge_key_one], right_on=[merge_key_two], how=how_to_use, suffixes=[f'_{suffix_one}', f'_{suffix_two}'])
    except ValueError:
        raise make_incompatible_merge_key_error(error_modal=False)
