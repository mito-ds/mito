#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.code_chunk_utils import get_right_combine_with_column_delete_code_chunk
from mitosheet.code_chunks.step_performers.column_steps.delete_column_code_chunk import DeleteColumnsCodeChunk
from mitosheet.is_type_utils import (is_bool_dtype,
                                                   is_datetime_dtype,
                                                   is_int_dtype,
                                                   is_number_dtype,
                                                   is_timedelta_dtype)
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import \
    get_column_header_as_transpiled_code
from mitosheet.types import ColumnID


class SetCellValueCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, sheet_index: int, column_id: ColumnID, row_index: Any, old_value: Any, new_value: Any, type_corrected_new_value: Optional[Any]):
        super().__init__(prev_state)
        self.sheet_index = sheet_index
        self.column_id = column_id
        self.row_index = row_index
        self.old_value = old_value
        self.new_value = new_value
        self.type_corrected_new_value = type_corrected_new_value

        self.df_name = self.prev_state.df_names[self.sheet_index]
        self.column_header = self.prev_state.column_ids.get_column_header_by_id(self.sheet_index, self.column_id)
        self.column_dtype = str(self.prev_state.dfs[self.sheet_index][self.column_header].dtype)

    def get_display_name(self) -> str:
        return 'Set cell value'
    
    def get_description_comment(self) -> str:
        return f'Set a cell value in {self.column_header}'

    def get_code(self) -> Tuple[List[str], List[str]]:

        code: List[str] = []

        # If nothings changed, we don't write any code
        if self.old_value == self.new_value:
            return code, []

        transpiled_column_header = get_column_header_as_transpiled_code(self.column_header)

        # If the series is an int, but the new value is a float, convert the series to floats before adding the new value
        if self.new_value is not None and '.' in self.new_value and is_int_dtype(self.column_dtype):
            code.append(f'{self.df_name}[{transpiled_column_header}] = {self.df_name}[\'{self.column_header}\'].astype(\'float\')')

        # Actually set the new value
        # We don't need to wrap the value in " if its None, a Boolean Series, or a Number Series.
        if self.type_corrected_new_value is None or is_bool_dtype(self.column_dtype) or is_number_dtype(self.column_dtype):
            code.append(f'{self.df_name}.at[{self.row_index}, {transpiled_column_header}] = {self.type_corrected_new_value}')
        elif is_datetime_dtype(self.column_dtype):
            code.append(f'{self.df_name}.at[{self.row_index}, {transpiled_column_header}] = pd.to_datetime(\"{self.type_corrected_new_value}\")')
        elif is_timedelta_dtype(self.column_dtype):
            code.append(f'{self.df_name}.at[{self.row_index}, {transpiled_column_header}] = pd.to_timedelta(\"{self.type_corrected_new_value}\")')
        else:
            code.append(f'{self.df_name}.at[{self.row_index}, {transpiled_column_header}] = \"{self.type_corrected_new_value}\"')

        return code, [] # TODO: we might need pandas here as well!

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]

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