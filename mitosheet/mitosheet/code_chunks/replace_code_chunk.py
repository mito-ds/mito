
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID
from mitosheet.state import State

class ReplaceCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, search_value: str, replace_value: str):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.search_value = search_value
        self.replace_value = replace_value

    def get_display_name(self) -> str:
        return 'Replace'
    
    def get_description_comment(self) -> str:
        return "Replace {self.search_value} with {self.replace_value} in {self.df_name}}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        search_value = self.search_value
        replace_value = self.replace_value
        df = self.post_state.dfs[self.sheet_index]
        df_name = self.post_state.df_names[self.sheet_index]

        code_chunk = [
            '# Replace search values',
            f'{df_name} = {df_name}.astype(str).replace("(?i){search_value}", "{replace_value}", regex=True).astype({df_name}.dtypes.to_dict())'
        ]

        if df.select_dtypes(include='bool').any().any():
            code_chunk = [
                '# Replace search values',
                f"non_bool_cols, bool_cols = {df_name}.select_dtypes(exclude='bool'), {df_name}.select_dtypes(include='bool')",
                f"{df_name}[non_bool_cols.columns] = non_bool_cols.astype(str).replace('(?i){search_value}', '{replace_value}', regex=True).astype(non_bool_cols.dtypes.to_dict())",
                f"{df_name}[bool_cols.columns] = bool_cols.astype(str).replace('(?i){search_value}', '{replace_value}').map(cast_string_to_bool)"
            ]

        return [], code_chunk

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]
    