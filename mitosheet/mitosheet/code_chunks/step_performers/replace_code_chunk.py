#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State


class ReplaceCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, search_value: str, replace_value: str):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.search_value = search_value
        self.replace_value = replace_value

        self.df_name = self.post_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'Replace Search Values'
    
    def get_description_comment(self) -> str:
        return f'Replace {self.search_value} with {self.replace_value} in {self.df_name}'

    def get_code(self) -> Tuple[List[str], List[str]]:
        search_value = self.search_value
        replace_value = self.replace_value

        df = self.post_state.dfs[self.sheet_index]

        code_chunk = [
            '# Replace search values',
            f'{df} = {df}.astype(str).replace("(?i){search_value}", {replace_value}, regex=True)',
            f'{df} = {df}.astype(df.dtypes.to_dict()))'    
        ]
        
        return code_chunk, code_chunk

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]