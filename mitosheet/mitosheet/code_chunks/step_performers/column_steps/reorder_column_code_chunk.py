#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code


class ReorderColumnCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Reordered column'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        column_header = self.post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        return f'Reordered column {column_header}'

    def get_code(self) -> List[str]:
        from mitosheet.step_performers.column_steps.reorder_column import get_valid_index
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        new_column_index = self.get_param('new_column_index')

        column_header = self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)

        new_column_index = get_valid_index(self.prev_state.dfs, sheet_index, new_column_index)
        df_name = self.post_state.df_names[sheet_index]

        # Get columns in df
        columns_list_line = f'{df_name}_columns = [col for col in {df_name}.columns if col != {transpiled_column_header}]'

        # Insert column into correct location 
        insert_line = f'{df_name}_columns.insert({new_column_index}, {transpiled_column_header})'
        
        # Apply reorder line
        apply_reorder_line = f'{df_name} = {df_name}[{df_name}_columns]'

        return [columns_list_line, insert_line, apply_reorder_line]

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]