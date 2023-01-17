
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code
from mitosheet.types import ColumnID

class PromoteRowToHeaderCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, index: Any):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.index = index

        self.df_name = self.post_state.df_names[self.sheet_index]


    def get_display_name(self) -> str:
        return 'Promote Row To Header'
    
    def get_description_comment(self) -> str:

        return f"Promoted row {self.index} to header in {self.df_name}"
        
    def get_code(self) -> Tuple[List[str], List[str]]:
        transpiled_index = column_header_to_transpiled_code(self.index)
        return [
            f"{self.df_name}.columns = {self.df_name}.loc[{transpiled_index}]",
            f"{self.df_name}.drop(labels=[{transpiled_index}], inplace=True)",
        ], []
    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]
    