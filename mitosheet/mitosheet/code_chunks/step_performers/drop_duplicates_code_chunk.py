#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State

from mitosheet.transpiler.transpile_utils import (
    column_header_list_to_transpiled_code, column_header_to_transpiled_code)
from mitosheet.types import ColumnID

class DropDuplicatesCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, column_ids: List[ColumnID], keep: str):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.column_ids = column_ids
        self.keep = keep

        self.df_name = self.post_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'Dropped duplicates'
    
    def get_description_comment(self) -> str:
        return f'Dropped duplicates in {self.df_name}'

    def get_code(self) -> Tuple[List[str], List[str]]:
        column_headers = [
            self.prev_state.column_ids.get_column_header_by_id(self.sheet_index, column_id)
            for column_id in self.column_ids
        ]

        # If the subset is none, then we don't actually do the drop, as there are no
        # duplicates between 0 columns
        if len(column_headers) == 0:
            return [], []
        
        # We leave subset and keep empty if they are not used
        param_string = ''
        if len(column_headers) != len(self.post_state.dfs[self.sheet_index].keys()):
            param_string += 'subset=' + column_header_list_to_transpiled_code(column_headers) + ', '
        
        param_string += 'keep=' + column_header_to_transpiled_code(self.keep) # not a column header, but we can use the same utility

        return [
            f'{self.df_name} = {self.df_name}.drop_duplicates({param_string})'
        ], []
    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]