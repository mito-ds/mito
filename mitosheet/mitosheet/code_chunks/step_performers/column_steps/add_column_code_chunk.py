#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from typing import List, Optional

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.empty_code_chunk import EmptyCodeChunk
from mitosheet.code_chunks.step_performers.column_steps.delete_column_code_chunk import DeleteColumnCodeChunk
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code


class AddColumnCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Added column'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        column_header = self.get_param('column_header')
        return f'Added column {column_header}'

    def get_code(self) -> List[str]:

        sheet_index = self.get_param('sheet_index')
        column_header = self.get_param('column_header')
        column_header_index = self.get_execution_data('column_header_index')

        transpiled_column_header = column_header_to_transpiled_code(column_header)
        column_header_index = column_header_index
        return [
            f'{self.post_state.df_names[sheet_index]}.insert({column_header_index}, {transpiled_column_header}, 0)'
        ]

    def _combine_right_with_delete_column_code_chunk(self, other_code_chunk: DeleteColumnCodeChunk) -> Optional["EmptyCodeChunk"]:
        # Make sure the sheet index matches up first
        if not self.params_match(other_code_chunk, ['sheet_index']):
            return None
        
        # Check to see if the column ids overlap
        sheet_index = self.get_param('sheet_index')
        added_column_header = self.get_param('column_header')
        added_column_id = self.post_state.column_ids.get_column_id_by_header(sheet_index, added_column_header)
        deleted_column_ids = other_code_chunk.get_param('column_ids')

        if added_column_id in deleted_column_ids and len(deleted_column_ids) == 1:
            return EmptyCodeChunk(
                self.prev_state, 
                other_code_chunk.post_state, 
                other_code_chunk.params,
                other_code_chunk.execution_data # TODO: this is out of date, but we don't use it!
            )
        elif added_column_id in deleted_column_ids:
            # TODO: check this is the right thing
            new_deleted_column_ids = copy(deleted_column_ids)
            new_deleted_column_ids.remove(added_column_id)

            return DeleteColumnCodeChunk(
                self.prev_state,
                other_code_chunk.post_state,
                {
                    'sheet_index': sheet_index,
                    'column_ids': new_deleted_column_ids
                },
                other_code_chunk.execution_data
            )
        
        return None

    def combine_right(self, other_code_chunk) -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, DeleteColumnCodeChunk):
            return self._combine_right_with_delete_column_code_chunk(other_code_chunk)
            
        return None