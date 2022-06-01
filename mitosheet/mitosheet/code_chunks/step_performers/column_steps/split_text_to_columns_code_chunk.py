#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.sheet_functions.types.utils import is_datetime_dtype, is_string_dtype, is_timedelta_dtype
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code, column_header_to_transpiled_code
from mitosheet.types import ColumnHeader, ColumnID


class SplitTextToColumnsCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Split text to columns'
    
    def get_description_comment(self) -> str:
        sheet_index: int = self.get_param('sheet_index')
        column_id: ColumnID = self.get_param('column_id')
        delimiters: List[str] = self.get_param('delimiters')
        column_header = self.post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        delimiters_string = (', ').join(map(lambda x: f'"{x}"', delimiters))
        return f'Split {column_header} on {delimiters_string}'

    def get_code(self) -> List[str]:
        sheet_index: int = self.get_param('sheet_index')
        column_id: ColumnID = self.get_param('column_id')
        delimiters: List[str] = self.get_param('delimiters')
        new_column_headers: List[ColumnHeader] = self.get_execution_data('new_column_headers')

        delimiter_string = repr('|'.join(delimiters))
        
        column_header = self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)
        new_transpiled_column_headers = column_header_list_to_transpiled_code(new_column_headers)
        column_idx = self.prev_state.column_ids.get_column_ids(sheet_index).index(column_id)
        df_name = self.post_state.df_names[sheet_index]

        # Split column
        dtype_string = str(self.prev_state.dfs[sheet_index][column_header].dtype)
        if is_string_dtype(dtype_string):
            string_conversion = ''
        elif is_datetime_dtype(dtype_string):
            string_conversion = ".dt.strftime('%Y-%m-%d %X')"
        elif is_timedelta_dtype(dtype_string):
            string_conversion = ".apply(lambda x: str(x))"
        else:
            string_conversion = ".astype('str')"

        split_column_line = f'{df_name}[{new_transpiled_column_headers}] = {df_name}[{transpiled_column_header}]{string_conversion}.str.split({delimiter_string}, -1, expand=True)'

        # Reorder columns 
        reorder_columns_line = f'{df_name} = {df_name}[{df_name}.columns[:{column_idx + 1}].tolist() + {new_transpiled_column_headers} + {df_name}.columns[{column_idx + 1}:-{len(new_column_headers)}].tolist()]'

        return [split_column_line, reorder_columns_line]

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]