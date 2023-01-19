
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State

class ResetIndexCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, drop: bool):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.drop = drop

        self.df_name = self.post_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'Reset Index'
    
    def get_description_comment(self) -> str:
        return f"Reset {self.df_name} index"

    def get_code(self) -> Tuple[List[str], List[str]]:
        return [f'{self.df_name} = {self.df_name}.reset_index({"drop=True" if self.drop else ""})'], []

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]
    