
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, Dict, List, Optional
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code

class DeleteRowCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, params: Dict[str, Any], execution_data: Optional[Dict[str, Any]]):
        super().__init__(prev_state, post_state, params, execution_data)
        self.sheet_index: int = params['sheet_index']
        self.labels: List[Any] = params['labels']

        self.df_name = self.post_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'Delete Row'
    
    def get_description_comment(self) -> str:
        return f'Deleted {len(self.labels)} row{"" if len(self.labels) == 1 else "s"} in {self.df_name}'
        
    def get_code(self) -> List[str]:
        return [f'{self.df_name}.drop(labels={column_header_list_to_transpiled_code(self.labels)}, inplace=True)']

    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]

    def _combine_right_with_delete_row_code_chunk(self, other_code_chunk: "DeleteRowCodeChunk") -> Optional["DeleteRowCodeChunk"]:
        if not self.params_match(other_code_chunk, ['sheet_index']):
            return None
        
        all_labels = copy(self.labels) # Make sure to copy this so we don't get weird bugs w/ duplication
        all_labels.extend(other_code_chunk.labels)
        
        return DeleteRowCodeChunk(
            self.prev_state,
            other_code_chunk.post_state,
            {
                'sheet_index': self.sheet_index,
                'labels': all_labels
            },
            other_code_chunk.execution_data
        )

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        if isinstance(other_code_chunk, DeleteRowCodeChunk):
            return self._combine_right_with_delete_row_code_chunk(other_code_chunk)
            
        return None
    