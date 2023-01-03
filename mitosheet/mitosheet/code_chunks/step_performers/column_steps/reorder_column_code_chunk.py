#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code
from mitosheet.types import ColumnID


class ReorderColumnCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, params: Dict[str, Any], execution_data: Optional[Dict[str, Any]]):
        super().__init__(prev_state, post_state, params, execution_data)
        self.sheet_index: int = params['sheet_index']
        self.column_id: ColumnID = params['column_id']
        self.new_column_index: int = params['new_column_index']

        self.df_name = self.post_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'Reordered column'
    
    def get_description_comment(self) -> str:
        column_header = self.post_state.column_ids.get_column_header_by_id(self.sheet_index, self.column_id)
        return f'Reordered column {column_header}'

    def get_code(self) -> List[str]:
        from mitosheet.step_performers.column_steps.reorder_column import get_valid_index

        column_header = self.prev_state.column_ids.get_column_header_by_id(self.sheet_index, self.column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)

        new_column_index = get_valid_index(self.prev_state.dfs, self.sheet_index, self.new_column_index)

        # Get columns in df
        columns_list_line = f'{self.df_name}_columns = [col for col in {self.df_name}.columns if col != {transpiled_column_header}]'

        # Insert column into correct location 
        insert_line = f'{self.df_name}_columns.insert({new_column_index}, {transpiled_column_header})'
        
        # Apply reorder line
        apply_reorder_line = f'{self.df_name} = {self.df_name}[{self.df_name}_columns]'

        return [columns_list_line, insert_line, apply_reorder_line]

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]