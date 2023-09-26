#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code
from mitosheet.types import ColumnID

class SortCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, column_id: ColumnID, sort_direction: str):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.column_id = column_id
        self.sort_direction = sort_direction

        self.df_name = self.post_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'Sorted a column'
    
    def get_description_comment(self) -> str:
        column_header = self.post_state.column_ids.get_column_header_by_id(self.sheet_index, self.column_id)
        return f'Sorted {column_header} in {self.sort_direction} order'

    def get_code(self) -> Tuple[List[str], List[str]]:
        from mitosheet.step_performers.sort import SORT_DIRECTION_ASCENDING

        # If there is no sort applied in this step, then bail with no code
        from mitosheet.step_performers.sort import SORT_DIRECTION_NONE
        if self.sort_direction == SORT_DIRECTION_NONE:
            return [], []

        column_header = self.post_state.column_ids.get_column_header_by_id(self.sheet_index, self.column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)
        
        na_position_string = 'first' if self.sort_direction == SORT_DIRECTION_ASCENDING else 'last'
        
        return [
            f'{self.df_name} = {self.df_name}.sort_values(by={transpiled_column_header}, ascending={self.sort_direction == SORT_DIRECTION_ASCENDING}, na_position=\'{na_position_string}\')', 
        ], []
    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]
