
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code
from mitosheet.types import ColumnID

class MeltCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, id_var_column_ids: List[ColumnID], value_var_column_ids: List[ColumnID], include_value_vars: bool):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.id_var_column_ids = id_var_column_ids
        self.value_var_column_ids = value_var_column_ids
        self.include_value_vars = include_value_vars

        self.df_name = self.post_state.df_names[self.sheet_index]
        self.new_df_name = self.post_state.df_names[-1]

    def get_display_name(self) -> str:
        return 'Melt'
    
    def get_description_comment(self) -> str:
        return f"Unpivoted {self.df_name} into {self.new_df_name}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        id_vars = self.prev_state.column_ids.get_column_headers_by_ids(self.sheet_index, self.id_var_column_ids)
        value_vars = self.prev_state.column_ids.get_column_headers_by_ids(self.sheet_index, self.value_var_column_ids)

        value_vars = list(filter(lambda value_var: value_var not in id_vars, value_vars))

        param_string = f'id_vars={column_header_list_to_transpiled_code(id_vars)}'
        if self.include_value_vars:
            param_string += f', value_vars={column_header_list_to_transpiled_code(value_vars)}'

        return [f'{self.new_df_name} = {self.df_name}.melt({param_string})'], []
    
    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs) - 1]
    