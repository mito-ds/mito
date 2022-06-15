#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.


from typing import List, Optional

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.code_chunk_utils import get_right_combine_with_column_delete_code_chunk
from mitosheet.code_chunks.step_performers.column_steps.delete_column_code_chunk import DeleteColumnsCodeChunk
from mitosheet.parser import parse_formula


class SetColumnFormulaCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Updated column formula'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        column_header = self.post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        return f'Set formula of {column_header}'

    def get_code(self) -> List[str]:
        """
        Use this helper function when making a change to a column and you want to transpile
        the columns that are dependant on the column you changed. 
        """
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        new_formula = self.get_param('new_formula')

        column_header = self.post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        python_code, _, _ = parse_formula(
            new_formula, 
            column_header,
            self.post_state.column_ids.get_column_headers(sheet_index),
            df_name=self.post_state.df_names[sheet_index]
        )

        return [
            python_code
        ]

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]

    def _combine_right_with_delete_column_code_chunk(self, other_code_chunk: DeleteColumnsCodeChunk) -> Optional[CodeChunk]:
        return get_right_combine_with_column_delete_code_chunk(
            self,
            other_code_chunk,
            'sheet_index',
            'column_id',
        )

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        if isinstance(other_code_chunk, DeleteColumnsCodeChunk):
            return self._combine_right_with_delete_column_code_chunk(other_code_chunk)

        return None
