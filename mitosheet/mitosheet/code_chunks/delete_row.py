
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code

class DeleteRowCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Delete Row'
    
    def get_description_comment(self) -> str:
        sheet_index: int = self.get_param('sheet_index')
        index: int = self.get_param('index')

        df_name = self.post_state.df_names[sheet_index]

        return f'Deleted a row in {df_name}'
        
    def get_code(self) -> List[str]:
        sheet_index: int = self.get_param('sheet_index')
        index: int = self.get_param('index')
        
        df_name = self.post_state.df_names[sheet_index]

        return [
            f'{df_name}.drop(labels=[{column_header_to_transpiled_code(index)}], inplace=True)'
        ]

    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]
    