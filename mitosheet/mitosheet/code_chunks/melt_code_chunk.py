
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code
from mitosheet.types import ColumnID

class MeltCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Melt'
    
    def get_description_comment(self) -> str:
        sheet_index: int = self.get_param('sheet_index')
        id_var_column_ids: List[ColumnID] = self.get_param('id_var_column_ids')
        value_var_column_ids: List[ColumnID] = self.get_param('value_var_column_ids')

        df_name = self.post_state.df_names[sheet_index]
        new_df_name = self.post_state.df_names[-1]
        
        return f"Unpivoted {df_name} into {new_df_name}"

    def get_code(self) -> List[str]:
        sheet_index: int = self.get_param('sheet_index')
        id_var_column_ids: List[ColumnID] = self.get_param('id_var_column_ids')
        value_var_column_ids: List[ColumnID] = self.get_param('value_var_column_ids')

        id_vars = self.prev_state.column_ids.get_column_headers_by_ids(sheet_index, id_var_column_ids)
        value_vars = self.prev_state.column_ids.get_column_headers_by_ids(sheet_index, value_var_column_ids)

        value_vars = list(filter(lambda value_var: value_var not in id_vars, value_vars))

        include_value_vars: bool = self.get_execution_data('include_value_vars')

        df_name = self.post_state.df_names[sheet_index]
        new_df_name = self.post_state.df_names[-1]

        param_string = f'id_vars={column_header_list_to_transpiled_code(id_vars)}'
        if include_value_vars:
            param_string += f', value_vars={column_header_list_to_transpiled_code(value_vars)}'

        return [f'{new_df_name} = {df_name}.melt({param_string})']
    
    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs) - 1]
    