
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, List, Optional
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code

class DeleteRowCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Delete Row'
    
    def get_description_comment(self) -> str:
        sheet_index: int = self.get_param('sheet_index')
        labels: List[Any] = self.get_param('labels')

        df_name = self.post_state.df_names[sheet_index]

        return f'Deleted {len(labels)} row{"" if len(labels) == 1 else "s"} in {df_name}'
        
    def get_code(self) -> List[str]:
        sheet_index: int = self.get_param('sheet_index')
        labels: List[Any] = self.get_param('labels')
        
        df_name = self.post_state.df_names[sheet_index]

        return [
            f'{df_name}.drop(labels={column_header_list_to_transpiled_code(labels)}, inplace=True)'
        ]

    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]

    def _combine_right_with_delete_row_code_chunk(self, other_code_chunk: "DeleteRowCodeChunk") -> Optional["DeleteRowCodeChunk"]:
        if not self.params_match(other_code_chunk, ['sheet_index']):
            return None
        
        all_labels = copy(self.get_param('labels')) # Make sure to copy this so we don't get weird bugs w/ duplication
        all_labels.extend(other_code_chunk.get_param('labels'))
        
        return DeleteRowCodeChunk(
            self.prev_state,
            other_code_chunk.post_state,
            {
                'sheet_index': self.get_param('sheet_index'),
                'labels': all_labels
            },
            other_code_chunk.execution_data
        )

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        if isinstance(other_code_chunk, DeleteRowCodeChunk):
            return self._combine_right_with_delete_row_code_chunk(other_code_chunk)
            
        return None
    