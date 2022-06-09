
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID

class TransposeCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Transpose'
    
    def get_description_comment(self) -> str:
        sheet_index: int = self.get_param('sheet_index')

        df_name = self.post_state.df_names[sheet_index]
        transposed_df_name = self.post_state.df_names[-1]
        
        return f"Transposed {df_name} into {transposed_df_name}"

    def get_code(self) -> List[str]:
        sheet_index: int = self.get_param('sheet_index')

        df_name = self.post_state.df_names[sheet_index]
        transposed_df_name = self.post_state.df_names[-1]

        return [
            f'{transposed_df_name} = {df_name}.T'
        ]

    
    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs) - 1]
    