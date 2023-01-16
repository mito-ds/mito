
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code, column_header_to_transpiled_code
from mitosheet.types import ColumnHeader, ColumnID

class OneHotEncodingCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, column_id: ColumnID, new_column_headers: List[ColumnHeader]):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.column_id = column_id
        self.new_column_headers = new_column_headers

    def get_display_name(self) -> str:
        return 'One Hot Encoding'
    
    def get_description_comment(self) -> str:
        column_header = self.post_state.column_ids.get_column_header_by_id(self.sheet_index, self.column_id)
        return f'One-hot Encoded {column_header}'
        
    def get_code(self) -> Tuple[List[str], List[str]]:
        column_header = self.post_state.column_ids.get_column_header_by_id(self.sheet_index, self.column_id)
        df_name = self.post_state.df_names[self.sheet_index]
        column_index = self.post_state.dfs[self.sheet_index].columns.tolist().index(column_header)

        transpiled_column_header = column_header_to_transpiled_code(column_header)
        new_transpiled_column_headers = column_header_list_to_transpiled_code(self.new_column_headers)

        encode_line = f'{df_name}[{new_transpiled_column_headers}] = pd.get_dummies({df_name}[{transpiled_column_header}])'
        reorder_columns_line = f'{df_name} = {df_name}[{df_name}.columns[:{column_index + 1}].tolist() + {new_transpiled_column_headers} + {df_name}.columns[{column_index + 1}:-{len(self.new_column_headers)}].tolist()]'

        return [
            encode_line,
            reorder_columns_line   
        ], ['import pandas as pd']

    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]
    