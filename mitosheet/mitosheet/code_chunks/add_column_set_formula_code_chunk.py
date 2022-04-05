#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.parser import parse_formula
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code


class AddColumnSetFormulaCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Added a column'
    
    def get_description_comment(self) -> str:
        column_header = self.get_param('column_header')
        return f'Added a column {column_header}'

    def get_code(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        column_header = self.get_param('column_header')
        column_header_index = self.get_execution_data('column_header_index')

        column_headers = self.post_state.dfs[sheet_index].keys()

        python_code, _, _ = parse_formula(
            self.post_state.column_spreadsheet_code[sheet_index][column_id], 
            column_header,
            column_headers,
            df_name=self.post_state.df_names[sheet_index],
            include_df_set=False
        )

        transpiled_column_header = column_header_to_transpiled_code(column_header)
        column_header_index = column_header_index
        return [
            f'{self.post_state.df_names[sheet_index]}.insert({column_header_index}, {transpiled_column_header}, {python_code})'
        ]
