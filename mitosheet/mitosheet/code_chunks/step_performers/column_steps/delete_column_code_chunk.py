#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from typing import List, Optional

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import \
    column_header_list_to_transpiled_code


class DeleteColumnsCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Deleted columns'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        column_ids = self.get_param('column_ids')
        column_headers = self.prev_state.column_ids.get_column_headers_by_ids(sheet_index, column_ids)
        return f'Deleted columns {", ".join([str(ch) for ch in column_headers])}'

    def get_code(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')
        column_ids = self.get_param('column_ids')

        df_name = self.post_state.df_names[sheet_index]
        column_headers_list_string = column_header_list_to_transpiled_code(
            [self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id) for column_id in column_ids]
        )

        return [f'{df_name}.drop({column_headers_list_string}, axis=1, inplace=True)']

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]

    def _combine_right_with_delete_columns_code_chunk(self, other_code_chunk: "DeleteColumnsCodeChunk") -> Optional["DeleteColumnsCodeChunk"]:
        if not self.params_match(other_code_chunk, ['sheet_index']):
            return None

        first_column_ids = self.get_param('column_ids')
        second_column_ids = other_code_chunk.get_param('column_ids')
        all_column_ids = first_column_ids + second_column_ids

        # Use a loop rather than a set so we preserve the order of the columns being deleted
        new_column_ids = []
        for column_id in all_column_ids:
            if column_id not in new_column_ids:
                new_column_ids.append(column_id)

        return DeleteColumnsCodeChunk(
            self.prev_state,
            other_code_chunk.post_state,
            {
                'sheet_index': self.get_param('sheet_index'),
                'column_ids': new_column_ids
            },
            other_code_chunk.execution_data
        )

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        if isinstance(other_code_chunk, DeleteColumnsCodeChunk):
            return self._combine_right_with_delete_columns_code_chunk(other_code_chunk)
            
        return None