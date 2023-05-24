
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID
from mitosheet.state import State

class UserDefinedImportCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, importer: str):
        super().__init__(prev_state, post_state)
        self.importer = importer

        self.df_name = post_state.df_names[-1]

    def get_display_name(self) -> str:
        return 'User Defined Import'
    
    def get_description_comment(self) -> str:
        return f"Imported {self.df_name} using {self.importer}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        # For each new dataframe, we get it's name
        new_df_names = self.post_state.df_names[len(self.prev_state.df_names):]
        df_name_string = ', '.join(new_df_names)
        code = f"{df_name_string} = {self.importer}()"
        return [code], []
    
    def get_created_sheet_indexes(self) -> Optional[List[int]]:
        num_new_dfs = len(self.post_state.dfs) - len(self.prev_state.dfs)
        return [i for i in range(len(self.post_state.dfs) - num_new_dfs, len(self.post_state.dfs))]