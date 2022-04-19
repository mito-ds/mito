#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from typing import List, Optional

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.column_steps.delete_column_code_chunk import DeleteColumnsCodeChunk
from mitosheet.transpiler.transpile_utils import column_header_map_to_string


class RenameColumnsCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Renamed columns'
    
    def get_description_comment(self) -> str:
        column_ids_to_new_column_headers = self.get_param('column_ids_to_new_column_headers')
        new_column_headers = column_ids_to_new_column_headers.values()
        return f'Renamed columns {", ".join(new_column_headers)}'

    def get_code(self) -> List[str]:

        sheet_index = self.get_param('sheet_index')
        column_ids_to_new_column_headers = self.get_param('column_ids_to_new_column_headers')

        old_column_header_to_new_column_header_map = dict()
        df_name = self.post_state.df_names[sheet_index]
        for column_id, new_column_header in column_ids_to_new_column_headers.items():
            old_column_header_to_new_column_header_map[self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)] = new_column_header

        rename_dict = column_header_map_to_string(old_column_header_to_new_column_header_map)
        rename_string = f'{df_name}.rename(columns={rename_dict}, inplace=True)'
        return [rename_string]

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]

    def _combine_right_with_rename_columns_code_chunk(self, other_code_chunk: "RenameColumnsCodeChunk") -> Optional["RenameColumnsCodeChunk"]:
        if not self.params_match(other_code_chunk, ['sheet_index']):
            return None

        new_rename_dict = copy(self.get_param('column_ids_to_new_column_headers'))
        new_rename_dict.update(
            other_code_chunk.get_param('column_ids_to_new_column_headers')
        )

        return RenameColumnsCodeChunk(
            self.prev_state,
            other_code_chunk.post_state,
            {
                'sheet_index': self.get_param('sheet_index'),
                'column_ids_to_new_column_headers': new_rename_dict
            },
            other_code_chunk.execution_data
        )
    
    def _combine_right_with_delete_columns_code_chunk(self, other_code_chunk: "DeleteColumnsCodeChunk") -> Optional[CodeChunk]:
        if not self.params_match(other_code_chunk, ['sheet_index']):
            return None

        column_ids_to_new_column_headers = self.get_param('column_ids_to_new_column_headers')
        column_ids_being_renamed = column_ids_to_new_column_headers.keys()
        column_ids_being_deleted = other_code_chunk.get_param('column_ids')

        if set(column_ids_being_renamed).issubset(set(column_ids_being_deleted)):
            # If the columns being deleted are columns that were renamed, we can skip
            # the rename step and just do the deletion of these columns
            return DeleteColumnsCodeChunk(
                self.prev_state,
                other_code_chunk.post_state,
                other_code_chunk.params,
                other_code_chunk.execution_data
            )
        
        return None

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        if isinstance(other_code_chunk, RenameColumnsCodeChunk):
            return self._combine_right_with_rename_columns_code_chunk(other_code_chunk)
        if isinstance(other_code_chunk, DeleteColumnsCodeChunk):
            return self._combine_right_with_delete_columns_code_chunk(other_code_chunk)
            
        return None