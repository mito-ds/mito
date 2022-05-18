#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code


class SplitTextToColumnsCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Split text to columns'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        delimiters = self.get_param('delimiters')
        column_header = self.post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        delimiters_string = (' ,').join(delimiters)
        return f'Split {column_header} on {delimiters_string}'

    def get_code(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        delimiters = self.get_param('delimiters')
        print(delimiters)
        new_column_headers = self.execution_data['new_column_headers']

        delimiter_string = '|'.join(delimiters)
        column_header = self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)
        column_id_index = self.prev_state.column_ids.get_column_ids(sheet_index).index(column_id)
        df_name = self.post_state.df_names[sheet_index]

        # Split column
        split_column_line = f'{df_name}[{new_column_headers}] = {df_name}[{transpiled_column_header}].str.split({delimiter_string}, -1, expand=True)'

        # Reorder columns 
        reorder_columns_line = f'{df_name}.columns = {df_name}.columns[:{column_id_index + 1}].tolist() + {new_column_headers} + {df_name}.columns[{column_id_index + 1}:-{len(new_column_headers)}].tolist()'

        return [split_column_line, reorder_columns_line]

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]