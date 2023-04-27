
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code
from mitosheet.types import ColumnID
from mitosheet.state import State

class ColumnHeadersTransformCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, transformation: Any):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.transformation = transformation

        self.df_name = self.post_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'Column Headers Transform'
    
    def get_description_comment(self) -> str:
        if self.transformation['type'] == 'replace':
            return f"Replaced column headers in {self.df_name}"

        return f"Transformed headers in {self.df_name} to {self.transformation['type']}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        code = []
        if self.transformation['type'] == 'uppercase':
            code.append(f"{self.df_name}.columns = [col.upper() if isinstance(col, str) else col for col in {self.df_name}.columns]")
        elif self.transformation['type'] == 'lowercase':
            code.append(f"{self.df_name}.columns = [col.lower() if isinstance(col, str) else col for col in {self.df_name}.columns]")
        elif self.transformation['type'] == 'replace':
            old = column_header_to_transpiled_code(self.transformation['old'])
            new = column_header_to_transpiled_code(self.transformation['new'])
            code.append(f"{self.df_name}.columns = [col.replace({old}, {new}) if isinstance(col, str) else col for col in {self.df_name}.columns]")
        else:
            raise ValueError(f'Unknown transformation type: {self.transformation["type"]}')

        return code, []

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        if isinstance(other_code_chunk, ColumnHeadersTransformCodeChunk):
            if _is_uppercase_or_lowercase_column_header_transform_code_chunk(self) and _is_uppercase_or_lowercase_column_header_transform_code_chunk(other_code_chunk):
                return other_code_chunk
            
        return None

def _is_uppercase_or_lowercase_column_header_transform_code_chunk(code_chunk: CodeChunk) -> bool:
        return isinstance(code_chunk, ColumnHeadersTransformCodeChunk) and (code_chunk.transformation['type'] == 'uppercase' or code_chunk.transformation['type'] == 'lowercase')
