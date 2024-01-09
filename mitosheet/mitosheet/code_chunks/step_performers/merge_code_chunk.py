#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.


from typing import Any, Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.errors import MitoError
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import (
    get_column_header_list_as_transpiled_code, get_column_header_as_transpiled_code)
from mitosheet.types import ColumnID, ColumnHeader

LOOKUP = 'lookup'
UNIQUE_IN_LEFT = 'unique in left'
UNIQUE_IN_RIGHT = 'unique in right'


class MergeCodeChunk(CodeChunk):


    def __init__(
        self,
        prev_state: State,
        how: str,
        destination_sheet_index: Optional[int],
        sheet_index_one: int, 
        sheet_index_two: int, 
        merge_key_column_ids: List[List[ColumnID]], 
        selected_column_ids_one: List[ColumnID], 
        selected_column_ids_two: List[ColumnID], 
        new_df_name: str,
        optional_code_that_successfully_executed: Optional[Tuple[List[str], List[str]]] = None
    ):
        super().__init__(prev_state)
        self.how: str = how 
        self.destination_sheet_index = destination_sheet_index
        self.sheet_index_one: int = sheet_index_one 
        self.sheet_index_two: int = sheet_index_two 
        self.merge_key_column_ids: List[List[ColumnID]] = merge_key_column_ids 
        self.selected_column_ids_one: List[ColumnID] = selected_column_ids_one 
        self.selected_column_ids_two: List[ColumnID] = selected_column_ids_two

        if optional_code_that_successfully_executed is not None:
            self.optional_code_that_successfully_executed = optional_code_that_successfully_executed

        self.df_one_name = self.prev_state.df_names[self.sheet_index_one]
        self.df_two_name = self.prev_state.df_names[self.sheet_index_two]
        self.new_df_name = new_df_name

    def get_display_name(self) -> str:
        return 'Merged'
    
    def get_description_comment(self) -> str:
        return f'Merged {self.df_one_name} and {self.df_two_name} into {self.new_df_name}'

    def _combine_right_with_merge_code_chunk(self, merge_code_chunk: "MergeCodeChunk") -> Optional["CodeChunk"]:
        """
        We can combine a merge code chunk with the one before it if the destination
        sheet index of the other is the created code index of this step.
        """
        destination_sheet_index = self.destination_sheet_index
        other_destination_sheet_index = merge_code_chunk.destination_sheet_index

        # If both of the merges are overwriting the same destination sheet index, and they are both defined
        if destination_sheet_index is not None and destination_sheet_index == other_destination_sheet_index:
            return MergeCodeChunk(
                self.prev_state,
                merge_code_chunk.how,
                merge_code_chunk.destination_sheet_index,
                merge_code_chunk.sheet_index_one, 
                merge_code_chunk.sheet_index_two, 
                merge_code_chunk.merge_key_column_ids, 
                merge_code_chunk.selected_column_ids_one, 
                merge_code_chunk.selected_column_ids_two, 
                merge_code_chunk.new_df_name,
                merge_code_chunk.optional_code_that_successfully_executed
            )

        # If one of the merges if creating the code chunk that the new one is overwriting, then we can optimize
        # this as well
        created_sheet_index = self.get_created_sheet_indexes()
        if created_sheet_index is not None and created_sheet_index[0] == other_destination_sheet_index:
            return MergeCodeChunk(
                self.prev_state,
                merge_code_chunk.how,
                merge_code_chunk.destination_sheet_index,
                merge_code_chunk.sheet_index_one, 
                merge_code_chunk.sheet_index_two, 
                merge_code_chunk.merge_key_column_ids, 
                merge_code_chunk.selected_column_ids_one, 
                merge_code_chunk.selected_column_ids_two, 
                merge_code_chunk.new_df_name,
                merge_code_chunk.optional_code_that_successfully_executed
            )

        return None

    def combine_right(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, MergeCodeChunk):
            return self._combine_right_with_merge_code_chunk(other_code_chunk)
        return None
    
    def combine_left(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        # Because overwriting a merge overwrites all the edits on that merge table
        # we can optimize out any edits that are before the merge 
        # NOTE: if we start carrying edits on merges forward, we should remove this 
        # optimization

        destination_sheet_index = self.destination_sheet_index
        edited_sheet_indexes = other_code_chunk.get_edited_sheet_indexes()

        if edited_sheet_indexes is not None and len(edited_sheet_indexes) == 1 and edited_sheet_indexes[0] == destination_sheet_index:
            return MergeCodeChunk(
                other_code_chunk.prev_state,
                self.how,
                self.destination_sheet_index,
                self.sheet_index_one, 
                self.sheet_index_two, 
                self.merge_key_column_ids, 
                self.selected_column_ids_one, 
                self.selected_column_ids_two, 
                self.new_df_name,
                self.optional_code_that_successfully_executed
            )

        return None

    def get_code(self) -> Tuple[List[str], List[str]]:
        try:
            merge_keys_one: List[ColumnHeader] = self.prev_state.column_ids.get_column_headers_by_ids(self.sheet_index_one, list(map(lambda x: x[0], self.merge_key_column_ids)))
            merge_keys_two: List[ColumnHeader] = self.prev_state.column_ids.get_column_headers_by_ids(self.sheet_index_two, list(map(lambda x: x[1], self.merge_key_column_ids)))
        except KeyError:
            raise MitoError(
                'incompatible_merge_key_error',
                f"Could not find merge key in {self.df_one_name} or {self.df_two_name}",
                to_fix='',
                error_modal=False
            )

        selected_column_headers_one: List[ColumnHeader] = self.prev_state.column_ids.get_column_headers_by_ids(self.sheet_index_one, self.selected_column_ids_one)
        selected_column_headers_two: List[ColumnHeader] = self.prev_state.column_ids.get_column_headers_by_ids(self.sheet_index_two, self.selected_column_ids_two)

        if len(merge_keys_one) == 0 and len(merge_keys_two) == 0:
            return [f'{self.new_df_name} = pd.DataFrame()'], ['import pandas as pd']

        # Now, we build the merge code 
        merge_code = []
        if self.how == 'lookup':
            # If the mege is a lookup, then we add the drop duplicates code
            temp_df_name = 'temp_df'
            merge_code.append(f'{temp_df_name} = {self.df_two_name}.drop_duplicates(subset={get_column_header_list_as_transpiled_code(merge_keys_two)}) # Remove duplicates so lookup merge only returns first match')
            how_to_use = 'left'
        else:
            temp_df_name = self.df_two_name
            how_to_use = self.how

        # If we are only taking some columns, write the code to drop the ones we don't need!
        deleted_columns_one = set(self.prev_state.dfs[self.sheet_index_one].keys()).difference(set(selected_column_headers_one).union(set(merge_keys_one)))
        deleted_columns_two = set(self.prev_state.dfs[self.sheet_index_two].keys()).difference(set(selected_column_headers_two).union(set(merge_keys_two)))

        if len(deleted_columns_one) > 0:
            deleted_transpiled_column_header_one_list = get_column_header_list_as_transpiled_code(deleted_columns_one)
            merge_code.append(
                f'{self.df_one_name}_tmp = {self.df_one_name}.drop({deleted_transpiled_column_header_one_list}, axis=1)'
            )
        if len(deleted_columns_two) > 0:
            deleted_transpiled_column_header_two_list = get_column_header_list_as_transpiled_code(deleted_columns_two)
            merge_code.append(
                f'{self.df_two_name}_tmp = {temp_df_name}.drop({deleted_transpiled_column_header_two_list}, axis=1)'
            )

        # If we drop columns, we merge the new dataframes
        df_one_to_merge = self.df_one_name if len(deleted_columns_one) == 0 else f'{self.df_one_name}_tmp'
        df_two_to_merge = temp_df_name if len(deleted_columns_two) == 0 else f'{self.df_two_name}_tmp'

        # We insist column names are unique in dataframes, so we default the suffixes to be the dataframe names
        suffix_one = self.df_one_name
        suffix_two = self.df_two_name if self.df_two_name != self.df_one_name else f'{self.df_two_name}_2'

        # Finially append the merge
        if self.how == UNIQUE_IN_LEFT:
            merge_code.extend([
                f'{self.new_df_name} = {df_one_to_merge}.merge({df_two_to_merge}[{get_column_header_list_as_transpiled_code(merge_keys_two)}], left_on={get_column_header_list_as_transpiled_code(merge_keys_one)}, right_on={get_column_header_list_as_transpiled_code(merge_keys_two)}, how="left", indicator=True, suffixes=(None, "_y"))',
                f'{self.new_df_name} = {self.new_df_name}[{self.new_df_name}["_merge"] == "left_only"].drop(columns="_merge")[{df_one_to_merge}.columns].reset_index(drop=True)',
            ])
        elif self.how == UNIQUE_IN_RIGHT:
            merge_code.extend([
                f'{self.new_df_name} = {df_two_to_merge}.merge({df_one_to_merge}[{get_column_header_list_as_transpiled_code(merge_keys_one)}], left_on={get_column_header_list_as_transpiled_code(merge_keys_two)}, right_on={get_column_header_list_as_transpiled_code(merge_keys_one)}, how="left", indicator=True, suffixes=(None, "_y"))',
                f'{self.new_df_name} = {self.new_df_name}[{self.new_df_name}["_merge"] == "left_only"].drop(columns="_merge")[{df_two_to_merge}.columns].reset_index(drop=True)',
            ])
        else:      
            merge_code.append(
                f'{self.new_df_name} = {df_one_to_merge}.merge({df_two_to_merge}, left_on={get_column_header_list_as_transpiled_code(merge_keys_one)}, right_on={get_column_header_list_as_transpiled_code(merge_keys_two)}, how=\'{how_to_use}\', suffixes=[\'_{suffix_one}\', \'_{suffix_two}\'])'
            )

        # And then return it
        return merge_code, []

    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.prev_state.dfs)]
    
    def get_source_sheet_indexes(self) -> List[int]:
        return [self.sheet_index_one, self.sheet_index_two]
    
    def can_be_reordered_with(self, code_chunk: CodeChunk) -> bool:
        """
        A merge either creates or edits a sheet. In either case, we don't
        want to reorder around it as this may cause bugs -- so we don't. 
        """
        return False