
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.types import ColumnID

class TransposeCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index

        self.df_name = self.post_state.df_names[self.sheet_index]
        self.transposed_df_name = self.post_state.df_names[-1]

    def get_display_name(self) -> str:
        return 'Transpose'
    
    def get_description_comment(self) -> str:
        return f"Transposed {self.df_name} into {self.transposed_df_name}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        return [f'{self.transposed_df_name} = {self.df_name}.T'], []

    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs) - 1]
    