
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import get_column_header_as_transpiled_code
from mitosheet.types import ColumnID

class OneHotEncodingCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, sheet_index: int, column_id: ColumnID):
        super().__init__(prev_state)
        self.sheet_index = sheet_index
        self.column_id = column_id

        self.column_header = self.prev_state.column_ids.get_column_header_by_id(self.sheet_index, self.column_id)

    def get_display_name(self) -> str:
        return 'One Hot Encoding'
    
    def get_description_comment(self) -> str:
        return f'One-hot Encoded {self.column_header}'
        
    def get_code(self) -> Tuple[List[str], List[str]]:
        df_name = self.prev_state.df_names[self.sheet_index]
        column_index = self.prev_state.dfs[self.sheet_index].columns.tolist().index(self.column_header)

        transpiled_column_header = get_column_header_as_transpiled_code(self.column_header)

        encode_line = f'tmp_df = pd.get_dummies({df_name}[{transpiled_column_header}])'
        add_line = f'{df_name}[tmp_df.columns] = tmp_df'
        reorder_columns_line = f'{df_name} = {df_name}[{df_name}.columns[:{column_index + 1}].tolist() + tmp_df.columns.tolist() + {df_name}.columns[{column_index + 1}:-len(tmp_df.columns)].tolist()]'

        return [
            encode_line,
            add_line,
            reorder_columns_line   
        ], ['import pandas as pd']

    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]
    