
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code

class DeleteRowCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Delete Row'
    
    def get_description_comment(self) -> str:
        sheet_index: int = self.get_param('sheet_index')
        indexes: int = self.get_param('indexes')

        df_name = self.post_state.df_names[sheet_index]

        return f'Deleted {len(indexes)} row{"" if len(indexes) == 1 else "s"} in {df_name}'
        
    def get_code(self) -> List[str]:
        sheet_index: int = self.get_param('sheet_index')
        indexes: List[Any] = self.get_param('indexes')
        
        df_name = self.post_state.df_names[sheet_index]

        return [
            f'{df_name}.drop(labels={column_header_list_to_transpiled_code(indexes)}, inplace=True)'
        ]

    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]
    