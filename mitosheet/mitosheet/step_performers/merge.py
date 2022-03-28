#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.errors import (make_incompatible_merge_headers_error,
                              make_incompatible_merge_key_error)
from mitosheet.state import DATAFRAME_SOURCE_MERGED, State
from mitosheet.step_performers.step_performer import StepPerformer
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
    def step_display_name(cls) -> str:
        return 'Merged Dataframes'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        how: str,
        sheet_index_one: int,
        merge_key_column_id_one: ColumnID,
        selected_column_ids_one: List[ColumnID],
        sheet_index_two: int,
        merge_key_column_id_two: ColumnID,
        selected_column_ids_two: List[ColumnID],
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:

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
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        how: str,
        sheet_index_one: int,
        merge_key_column_id_one: ColumnID,
        selected_column_ids_one: List[ColumnID],
        sheet_index_two: int,
        merge_key_column_id_two: ColumnID,
        selected_column_ids_two: List[ColumnID],
    ) -> List[str]:

        merge_key_one = prev_state.column_ids.get_column_header_by_id(sheet_index_one, merge_key_column_id_one)
        merge_key_two = prev_state.column_ids.get_column_header_by_id(sheet_index_two, merge_key_column_id_two)

        selected_columns_one = prev_state.column_ids.get_column_headers_by_ids(sheet_index_one, selected_column_ids_one)
        selected_columns_two = prev_state.column_ids.get_column_headers_by_ids(sheet_index_two, selected_column_ids_two)

        # Update df indexes to start at 1
        df_one_name = post_state.df_names[sheet_index_one]
        df_two_name = post_state.df_names[sheet_index_two]
        df_new_name = post_state.df_names[len(post_state.dfs) - 1]

        # Now, we build the merge code 
        merge_code = []
        if how == 'lookup':
            # If the mege is a lookup, then we add the drop duplicates code
            temp_df_name = 'temp_df'
            merge_code.append(f'{temp_df_name} = {df_two_name}.drop_duplicates(subset={column_header_to_transpiled_code(merge_key_two)}) # Remove duplicates so lookup merge only returns first match')
            how_to_use = 'left'
        else:
            temp_df_name = df_two_name
            how_to_use = how


        # If we are only taking some columns, write the code to drop the ones we don't need!
        deleted_columns_one = set(post_state.dfs[sheet_index_one].keys()).difference(set(selected_columns_one))
        deleted_columns_two = set(post_state.dfs[sheet_index_two].keys()).difference(set(selected_columns_two))
        if len(deleted_columns_one) > 0:
            deleted_transpiled_column_header_one_list = column_header_list_to_transpiled_code(deleted_columns_one)
            merge_code.append(
                f'{df_one_name}_tmp = {df_one_name}.drop({deleted_transpiled_column_header_one_list}, axis=1)'
            )
        if len(deleted_columns_two) > 0:
            deleted_transpiled_column_header_two_list = column_header_list_to_transpiled_code(deleted_columns_two)
            merge_code.append(
                f'{df_two_name}_tmp = {temp_df_name}.drop({deleted_transpiled_column_header_two_list}, axis=1)'
            )

        # If we drop columns, we merge the new dataframes
        df_one_to_merge = df_one_name if len(deleted_columns_one) == 0 else f'{df_one_name}_tmp'
        df_two_to_merge = temp_df_name if len(deleted_columns_two) == 0 else f'{df_two_name}_tmp'

        # We insist column names are unique in dataframes, so we default the suffixes to be the dataframe names
        suffix_one = df_one_name
        suffix_two = df_two_name if df_two_name != df_one_name else f'{df_two_name}_2'

        # Finially append the merge
        if how == UNIQUE_IN_LEFT:
            merge_code.append(
                f'{df_new_name} = {df_one_to_merge}.copy(deep=True)[~{df_one_to_merge}["{merge_key_one}"].isin({df_two_to_merge}["{merge_key_two}"])]'
            )
        elif how == UNIQUE_IN_RIGHT:
            merge_code.append(
                f'{df_new_name} = {df_two_to_merge}.copy(deep=True)[~{df_two_to_merge}["{merge_key_two}"].isin({df_one_to_merge}["{merge_key_one}"])]'
            )
        else:      
            merge_code.append(
                f'{df_new_name} = {df_one_to_merge}.merge({df_two_to_merge}, left_on=[{column_header_to_transpiled_code(merge_key_one)}], right_on=[{column_header_to_transpiled_code(merge_key_two)}], how=\'{how_to_use}\', suffixes=[\'_{suffix_one}\', \'_{suffix_two}\'])'
            )

        # And then return it
        return merge_code

    @classmethod
    def describe( # type: ignore
        cls,
        how: str,
        sheet_index_one: int,
        merge_key_column_id_one: ColumnID,
        selected_column_ids_one: List[ColumnID],
        sheet_index_two: int,
        merge_key_column_id_two: ColumnID,
        selected_column_ids_two: List[ColumnID],
        df_names=None,
        **params
    ) -> str:
        if df_names is not None:
            df_one_name = df_names[sheet_index_one]
            df_two_name = df_names[sheet_index_two]
            return f'Merged {df_one_name} and {df_two_name}'
        return f'Merged dataframes {sheet_index_one} and {sheet_index_two}'
    
    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        how: str,
        sheet_index_one: int,
        merge_key_column_id_one: ColumnID,
        selected_column_ids_one: List[ColumnID],
        sheet_index_two: int,
        merge_key_column_id_two: ColumnID,
        selected_column_ids_two: List[ColumnID],
    ) -> Set[int]:
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
