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
from mitosheet.errors import (get_recent_traceback, make_incompatible_merge_headers_error,
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
        return 4

    @classmethod
    def step_type(cls) -> str:
        return 'merge'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        how: str = get_param(params, 'how')
        sheet_index_one: int = get_param(params, 'sheet_index_one')
        sheet_index_two: int = get_param(params, 'sheet_index_two')
        merge_key_column_ids: List[List[ColumnID]] = get_param(params, 'merge_key_column_ids')
        selected_column_ids_one: List[ColumnID] = get_param(params, 'selected_column_ids_one')
        selected_column_ids_two: List[ColumnID] = get_param(params, 'selected_column_ids_two')

        merge_keys_one = prev_state.column_ids.get_column_headers_by_ids(sheet_index_one, list(map(lambda x: x[0], merge_key_column_ids)))
        merge_keys_two = prev_state.column_ids.get_column_headers_by_ids(sheet_index_two, list(map(lambda x: x[1], merge_key_column_ids)))

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
            merge_keys_one,
            selected_columns_one,
            sheet_index_two,
            merge_keys_two,
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
            MergeCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'how'),
                get_param(params, 'sheet_index_one'),
                get_param(params, 'sheet_index_two'),
                get_param(params, 'merge_key_column_ids'),
                get_param(params, 'selected_column_ids_one'),
                get_param(params, 'selected_column_ids_two'),
            )
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}

def _execute_merge(
        dfs: List[pd.DataFrame], 
        df_names: List[str],
        how: str,
        sheet_index_one: int,
        merge_keys_one: List[ColumnHeader], 
        selected_columns_one: List[ColumnHeader],
        sheet_index_two: int,
        merge_keys_two: List[ColumnHeader],
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

    # If there's no merge keys, we return an empty dataframe
    if len(merge_keys_one) == 0 and len(merge_keys_two) == 0:
        return pd.DataFrame()

    if how == LOOKUP:
        # We drop duplicates to avoid pairwise duplication on the merge.
        temp_df = dfs[sheet_index_two].drop_duplicates(subset=merge_keys_two)
        # We overwrite the how variable to 'left' so it can be used in the merge
        how_to_use = 'left'
    else:
        temp_df = dfs[sheet_index_two]
        how_to_use = how

    # Then we delete all the columns from each we don't wanna keep (making sure to keep the merge keys)
    deleted_columns_one = set(dfs[sheet_index_one].keys()).difference(set(selected_columns_one).union(set(merge_keys_one)))
    deleted_columns_two = set(dfs[sheet_index_two].keys()).difference(set(selected_columns_two).union(set(merge_keys_two)))

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
            df_two_cleaned = df_two_cleaned.drop_duplicates(subset=merge_keys_two) # Remove duplicates so lookup merge only returns first match
            # Create a boolean index array for values only in the left sheet by turning on the indicator=True and then filtering on the result
            bool_index_array = df_one_cleaned.merge(df_two_cleaned, left_on=merge_keys_one, right_on=merge_keys_two, how='left', indicator=True)['_merge'] == 'left_only'
            # Get the final result by filtering on the boolean index array and then selecting the columns we want to keep
            return df_one_cleaned.copy(deep=True)[bool_index_array][selected_columns_one].reset_index(drop=True)
        if how == UNIQUE_IN_RIGHT:
            df_one_cleaned = df_one_cleaned.drop_duplicates(subset=merge_keys_one) # Remove duplicates so lookup merge only returns first match
            bool_index_array = df_one_cleaned.merge(df_two_cleaned, left_on=merge_keys_one, right_on=merge_keys_two, how='right', indicator=True)['_merge'] == 'right_only'
            return df_two_cleaned.copy(deep=True)[bool_index_array][selected_columns_two].reset_index(drop=True)
        else:
            return df_one_cleaned.merge(df_two_cleaned, left_on=merge_keys_one, right_on=merge_keys_two, how=how_to_use, suffixes=[f'_{suffix_one}', f'_{suffix_two}'])
    except ValueError:
        # If we get a value error from merging two incompatible columns, we go through and check 
        # to see which of the columns this is, so our error can be maximally informative
        for merge_key_one, merge_key_two in zip(merge_keys_one, merge_keys_two):
            merge_key_one_dtype = str(dfs[sheet_index_one][merge_key_one].dtype)
            merge_key_two_dtype = str(dfs[sheet_index_two][merge_key_two].dtype)

            if merge_key_one_dtype != merge_key_two_dtype:
                raise make_incompatible_merge_key_error(
                    merge_key_one=merge_key_one, 
                    merge_key_one_dtype=merge_key_one_dtype,
                    merge_key_two=merge_key_two, 
                    merge_key_two_dtype=merge_key_two_dtype,
                    error_modal=False
                )

        raise make_incompatible_merge_key_error(error_modal=False)

