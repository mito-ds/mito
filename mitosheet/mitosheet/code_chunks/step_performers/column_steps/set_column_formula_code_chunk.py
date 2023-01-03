#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.


from typing import Any, Dict, List, Optional

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.code_chunk_utils import get_right_combine_with_column_delete_code_chunk
from mitosheet.code_chunks.step_performers.column_steps.delete_column_code_chunk import DeleteColumnsCodeChunk
from mitosheet.parser import parse_formula
from mitosheet.state import State


class SetColumnFormulaCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, params: Dict[str, Any], execution_data: Optional[Dict[str, Any]]):
        super().__init__(prev_state, post_state, params, execution_data)
        self.sheet_index = params['sheet_index']
        self.column_id = params['column_id']
        self.new_formula = params['new_formula']

        self.df_name = self.post_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'Updated column formula'
    
    def get_description_comment(self) -> str:
        column_header = self.post_state.column_ids.get_column_header_by_id(self.sheet_index, self.column_id)
        return f'Set formula of {column_header}'

    def get_code(self) -> List[str]:
        column_header = self.post_state.column_ids.get_column_header_by_id(self.sheet_index, self.column_id)
        python_code, _, _ = parse_formula(
            self.new_formula, 
            column_header,
            self.post_state.column_ids.get_column_headers(self.sheet_index),
            df_name=self.post_state.df_names[self.sheet_index]
        )

        return [
            python_code
        ]

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]

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
