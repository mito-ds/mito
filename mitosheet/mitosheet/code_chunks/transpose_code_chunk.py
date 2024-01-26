
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.types import ColumnID

class TransposeCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, sheet_index: int, new_df_name: str):
        super().__init__(prev_state)
        self.sheet_index = sheet_index

        self.df_name = self.prev_state.df_names[self.sheet_index]
        self.new_df_name = new_df_name

    def get_display_name(self) -> str:
        return 'Transpose'
    
    def get_description_comment(self) -> str:
        return f"Transposed {self.df_name} into {self.new_df_name}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        return [f'{self.new_df_name} = {self.df_name}.T'], []

    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.prev_state.dfs)]
    
    def get_source_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]
    