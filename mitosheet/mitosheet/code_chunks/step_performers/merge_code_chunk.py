#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.


from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import (
    column_header_list_to_transpiled_code, column_header_to_transpiled_code)

LOOKUP = 'lookup'
UNIQUE_IN_LEFT = 'unique in left'
UNIQUE_IN_RIGHT = 'unique in right'


class MergeCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Merged'
    
    def get_description_comment(self) -> str:
        sheet_index_one = self.get_param('sheet_index_one')
        sheet_index_two = self.get_param('sheet_index_two')
        df_one_name = self.post_state.df_names[sheet_index_one]
        df_two_name = self.post_state.df_names[sheet_index_two]
        df_new_name = self.post_state.df_names[len(self.post_state.dfs) - 1]
        return f'Merged {df_one_name} and {df_two_name} into {df_new_name}'

    def get_code(self) -> List[str]:
        how = self.get_param('how') 
        sheet_index_one = self.get_param('sheet_index_one') 
        merge_key_column_id_one = self.get_param('merge_key_column_id_one') 
        selected_column_ids_one = self.get_param('selected_column_ids_one') 
        sheet_index_two = self.get_param('sheet_index_two') 
        merge_key_column_id_two = self.get_param('merge_key_column_id_two') 
        selected_column_ids_two = self.get_param('selected_column_ids_two')

        merge_key_one = self.prev_state.column_ids.get_column_header_by_id(sheet_index_one, merge_key_column_id_one)
        merge_key_two = self.prev_state.column_ids.get_column_header_by_id(sheet_index_two, merge_key_column_id_two)

        selected_columns_one = self.prev_state.column_ids.get_column_headers_by_ids(sheet_index_one, selected_column_ids_one)
        selected_columns_two = self.prev_state.column_ids.get_column_headers_by_ids(sheet_index_two, selected_column_ids_two)

        # Update df indexes to start at 1
        df_one_name = self.post_state.df_names[sheet_index_one]
        df_two_name = self.post_state.df_names[sheet_index_two]
        df_new_name = self.post_state.df_names[len(self.post_state.dfs) - 1]

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
        deleted_columns_one = set(self.post_state.dfs[sheet_index_one].keys()).difference(set(selected_columns_one))
        deleted_columns_two = set(self.post_state.dfs[sheet_index_two].keys()).difference(set(selected_columns_two))
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

    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs) - 1]