#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List, Optional, Union

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code


class RenameColumnCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Renamed column'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        old_column_header = self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        new_column_header = self.post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        return f'Renamed {old_column_header} to {new_column_header}'

    def get_code(self) -> List[str]:

        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        new_column_header = self.get_param('new_column_header')
        
        # Process the no-op if the header is empty
        if new_column_header == '':
            return []

        df_name = self.post_state.df_names[sheet_index]
        old_column_header = self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)

        transpiled_old_column_header = column_header_to_transpiled_code(old_column_header)
        transpiled_new_column_header = column_header_to_transpiled_code(new_column_header)
        rename_dict = "{" + f'{transpiled_old_column_header}: {transpiled_new_column_header}' + "}"

        rename_string = f'{df_name}.rename(columns={rename_dict}, inplace=True)'
        return [rename_string]

    def _combine_right_with_rename_column_code_chunk(self, other_code_chunk: "RenameColumnCodeChunk") -> Optional["RenameColumnCodeChunk"]:
        if not self.params_match(other_code_chunk, ['sheet_index', 'column_id']):
            return None

        return RenameColumnCodeChunk(
            self.prev_state, 
            other_code_chunk.post_state, 
            other_code_chunk.params,
            other_code_chunk.execution_data # TODO: this is out of date, but we don't use it!
        )

    def combine_right(self, other_code_chunk) -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, RenameColumnCodeChunk):
            return self._combine_right_with_rename_column_code_chunk(other_code_chunk)
            
        return None