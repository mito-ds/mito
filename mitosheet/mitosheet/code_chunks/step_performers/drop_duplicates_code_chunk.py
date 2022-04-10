#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk

from mitosheet.transpiler.transpile_utils import (
    column_header_list_to_transpiled_code, column_header_to_transpiled_code)

class DropDuplicatesCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Dropped duplicates'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        df_name = self.post_state.df_names[sheet_index]
        return f'Dropped duplicates in {df_name}'

    def get_code(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')
        column_ids = self.get_param('column_ids')
        keep = self.get_param('keep')

        column_headers = [
            self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
            for column_id in column_ids
        ]

        # If the subset is none, then we don't actually do the drop, as there are no
        # duplicates between 0 columns
        if len(column_headers) == 0:
            return []
        
        # We leave subset and keep empty if they are not used
        param_string = ''
        if len(column_headers) != len(self.post_state.dfs[sheet_index].keys()):
            param_string += 'subset=' + column_header_list_to_transpiled_code(column_headers) + ', '
        
        param_string += 'keep=' + column_header_to_transpiled_code(keep) # not a column header, but we can use the same utility

        df_name = self.post_state.df_names[sheet_index]

        return [
            f'{df_name} = {df_name}.drop_duplicates({param_string})'
        ]
    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]