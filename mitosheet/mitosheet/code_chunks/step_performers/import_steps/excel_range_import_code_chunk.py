
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.excel_utils import (get_column_from_column_index,
                                   get_col_and_row_indexes_from_range)
from mitosheet.public.v2.excel_utils import get_read_excel_params_from_range
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code
from mitosheet.types import ExcelRangeImport


EXCEL_RANGE_IMPORT_TYPE_RANGE = 'range'
EXCEL_RANGE_IMPORT_TYPE_UPPER_LEFT_VALUE = 'upper left corner value'
EXCEL_RANGE_END_CONDITION_FIRST_EMPTY_VALUE = 'first empty cell'
EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE = 'bottom left corner value'
EXCEL_RANGE_COLUMN_END_CONDITION_NUM_COLUMNS = 'num columns'


class ExcelRangeImportCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, file_path: str, sheet_name: str, range_imports: List[ExcelRangeImport]):
        super().__init__(prev_state, post_state)
        self.file_path = file_path
        self.sheet_name = sheet_name
        self.range_imports = range_imports

    def get_display_name(self) -> str:
        return 'Excel Range Import'
    
    def get_description_comment(self) -> str:
        
        return f"Imported {len(self.range_imports)} dataframes from {self.sheet_name} in {self.file_path}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        code = []
        for idx, range_import in enumerate(self.range_imports):

            sheet_index = len(self.prev_state.dfs) + idx
            df_name = self.post_state.df_names[sheet_index]

            # If it's an explicit range, then just import that exact range
            if range_import['type'] == EXCEL_RANGE_IMPORT_TYPE_RANGE:
                _range = range_import['value']
                skiprows, nrows, usecols = get_read_excel_params_from_range(_range)
                
                code.append(
                    f'{df_name} = pd.read_excel(\'{self.file_path}\', sheet_name=\'{self.sheet_name}\', skiprows={skiprows}, nrows={nrows}, usecols=\'{usecols}\')'
                )

            else:
                # Otherwise, if you're importing based on values, we generate dynamic code

                end_condition = range_import['end_condition'] # type: ignore

                end_condition = range_import['end_condition'] #type: ignore
                column_end_condition = range_import['column_end_condition'] #type: ignore

                assert end_condition['type'] in [EXCEL_RANGE_END_CONDITION_FIRST_EMPTY_VALUE, EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE]
                assert column_end_condition['type'] in [EXCEL_RANGE_END_CONDITION_FIRST_EMPTY_VALUE, EXCEL_RANGE_COLUMN_END_CONDITION_NUM_COLUMNS]

                upper_left_value = range_import['value']
                bottom_left_value = end_condition['value'] if end_condition['type'] == EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE else None
                num_columns = column_end_condition['value'] if column_end_condition['type'] == EXCEL_RANGE_COLUMN_END_CONDITION_NUM_COLUMNS else None

                bottom_left_value_string = f', bottom_left_value={column_header_to_transpiled_code(bottom_left_value)}' if bottom_left_value else ''
                num_columns_string = f', num_columns={column_header_to_transpiled_code(num_columns)}' if num_columns else ''
    
                code.extend([
                    f'_range = get_table_range_from_upper_left_corner_value({column_header_to_transpiled_code(self.file_path)}, {column_header_to_transpiled_code(self.sheet_name)}, {column_header_to_transpiled_code(upper_left_value)}{bottom_left_value_string}{num_columns_string})',
                    'skiprows, nrows, usecols = get_read_excel_params_from_range(_range)',
                    f'{df_name} = pd.read_excel(\'{self.file_path}\', sheet_name=\'{self.sheet_name}\', skiprows=skiprows, nrows=nrows, usecols=usecols)'
                ])
                

            # Add a new line in between different imports otherwise the code looks bad
            if idx < len(self.range_imports) - 1:
                code.append('')

        return code, ['import pandas as pd']

    def get_created_sheet_indexes(self) -> Optional[List[int]]:
        return [i for i in range(len(self.post_state.dfs) - len(self.range_imports), len(self.post_state.dfs))]

    def _combine_right_with_excel_range_import_code_chunk(self, excel_range_import_code_chunk: "ExcelRangeImportCodeChunk") -> Optional[CodeChunk]:
        if excel_range_import_code_chunk.file_path == self.file_path and excel_range_import_code_chunk.sheet_name == self.sheet_name:
            new_range_imports = copy(self.range_imports)
            new_range_imports.extend(excel_range_import_code_chunk.range_imports)

            return ExcelRangeImportCodeChunk(
                self.prev_state,
                excel_range_import_code_chunk.post_state,
                self.file_path,
                self.sheet_name,
                new_range_imports
            )

        return None


    def combine_right(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, ExcelRangeImportCodeChunk):
            return self._combine_right_with_excel_range_import_code_chunk(other_code_chunk)

        return None
    