#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List, Optional

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.code_chunk_utils import get_right_combine_with_column_delete_code_chunk
from mitosheet.code_chunks.step_performers.column_steps.delete_column_code_chunk import DeleteColumnsCodeChunk
from mitosheet.sheet_functions.types.utils import (is_bool_dtype,
                                                   is_datetime_dtype,
                                                   is_int_dtype,
                                                   is_number_dtype,
                                                   is_timedelta_dtype)
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code


class SetCellValueCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Set cell value'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        column_header = self.post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        return f'Set a cell value in {column_header}'

    def get_code(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        row_index = self.get_param('row_index')
        old_value = self.get_param('old_value')
        new_value = self.get_param('new_value')
        type_corrected_new_value = self.get_execution_data('type_corrected_new_value')

        code: List[str] = []

        # If nothings changed, we don't write any code
        if old_value == new_value:
            return code

        column_header = self.post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)

        # If the series is an int, but the new value is a float, convert the series to floats before adding the new value
        column_dtype = str(self.prev_state.dfs[sheet_index][column_header].dtype)
        if new_value is not None and '.' in new_value and is_int_dtype(column_dtype):
            code.append(f'{self.post_state.df_names[sheet_index]}[{transpiled_column_header}] = {self.post_state.df_names[sheet_index]}[\'{column_header}\'].astype(\'float\')')

        # Actually set the new value
        # We don't need to wrap the value in " if its None, a Boolean Series, or a Number Series.
        if type_corrected_new_value is None or is_bool_dtype(column_dtype) or is_number_dtype(column_dtype):
            code.append(f'{self.post_state.df_names[sheet_index]}.at[{row_index}, {transpiled_column_header}] = {type_corrected_new_value}')
        elif is_datetime_dtype(column_dtype):
            code.append(f'{self.post_state.df_names[sheet_index]}.at[{row_index}, {transpiled_column_header}] = pd.to_datetime(\"{type_corrected_new_value}\")')
        elif is_timedelta_dtype(column_dtype):
            code.append(f'{self.post_state.df_names[sheet_index]}.at[{row_index}, {transpiled_column_header}] = pd.to_timedelta(\"{type_corrected_new_value}\")')
        else:
            code.append(f'{self.post_state.df_names[sheet_index]}.at[{row_index}, {transpiled_column_header}] = \"{type_corrected_new_value}\"')

        return code

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]

    def _combine_right_with_delete_column_code_chunk(self, other_code_chunk: DeleteColumnsCodeChunk) -> Optional["CodeChunk"]:
        return get_right_combine_with_column_delete_code_chunk(
            self,
            other_code_chunk,
            'sheet_index',
            'column_id',
        )
    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        if isinstance(other_code_chunk, DeleteColumnsCodeChunk):
            return self._combine_right_with_delete_column_code_chunk(other_code_chunk)

        return None