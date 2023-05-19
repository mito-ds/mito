
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, Dict, List, Optional, Tuple, Union

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.excel_utils import (get_column_from_column_index,
                                   get_col_and_row_indexes_from_range)
from mitosheet.public.v2.excel_utils import get_read_excel_params_from_range
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code, param_dict_to_code
from mitosheet.types import ExcelRangeImport



EXCEL_RANGE_IMPORT_TYPE_RANGE = 'range'

EXCEL_SHEET_TYPE_SHEET_NAME = 'sheet name'
EXCEL_SHEET_TYPE_SHEET_INDEX = 'sheet index'

EXCEL_RANGE_START_CONDITION_UPPER_LEFT_VALUE = 'upper left corner value'
EXCEL_RANGE_START_CONDITION_UPPER_LEFT_VALUE_STARTS_WITH = 'upper left corner value starts with'
EXCEL_RANGE_START_CONDITION_UPPER_LEFT_VALUE_CONTAINS = 'upper left corner value contains'
EXCEL_RANGE_START_CONDITIONS = [
    EXCEL_RANGE_START_CONDITION_UPPER_LEFT_VALUE,
    EXCEL_RANGE_START_CONDITION_UPPER_LEFT_VALUE_STARTS_WITH,
    EXCEL_RANGE_START_CONDITION_UPPER_LEFT_VALUE_CONTAINS
]

EXCEL_RANGE_END_CONDITION_FIRST_EMPTY_VALUE = 'first empty cell'
EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE = 'bottom left corner value'
EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE_STARTS_WITH = 'bottom left corner value starts with'
EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE_CONTAINS = 'bottom left corner value contains'
EXCEL_RANGE_END_CONDITIONAL_BOTTOM_LEFT_CORNER_CONSECUTIVE_EMPTY_CELLS = 'bottom left corner consecutive empty cells'
EXCEL_RANGE_END_CONDITIONAL_BOTTOM_LEFT_CORNER_CONSECUTIVE_EMPTY_CELLS_IN_FIRST_COLUMN = 'bottom left corner consecutive empty cells in first column'
EXCEL_RANGE_END_CONDITION_ROW_ENTIRELY_EMPTY = 'row entirely empty'
EXCEL_RANGE_END_CONDITION_CUMULATIVE_NUMBER_OF_EMPTY_ROWS = 'cumulative number of empty rows'
EXCEL_RANGE_END_CONDTIONS = [
    EXCEL_RANGE_END_CONDITION_FIRST_EMPTY_VALUE,
    EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE,
    EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE_STARTS_WITH,
    EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE_CONTAINS,
    EXCEL_RANGE_END_CONDITIONAL_BOTTOM_LEFT_CORNER_CONSECUTIVE_EMPTY_CELLS,
    EXCEL_RANGE_END_CONDITIONAL_BOTTOM_LEFT_CORNER_CONSECUTIVE_EMPTY_CELLS_IN_FIRST_COLUMN,
    EXCEL_RANGE_END_CONDITION_ROW_ENTIRELY_EMPTY,
    EXCEL_RANGE_END_CONDITION_CUMULATIVE_NUMBER_OF_EMPTY_ROWS
]

EXCEL_RANGE_COLUMN_END_CONDITION_FIRST_EMPTY_CELL = 'first empty cell'
EXCEL_RANGE_COLUMN_END_CONDITION_NUM_COLUMNS = 'num columns'
EXCEL_RANGE_COLUMN_END_CONDITIONS = [
    EXCEL_RANGE_COLUMN_END_CONDITION_FIRST_EMPTY_CELL,
    EXCEL_RANGE_COLUMN_END_CONDITION_NUM_COLUMNS,
]

def get_table_range_params(sheet: Dict[str, Union[str, int]], start_condition: Any, end_condition: Any, column_end_condition: Any) -> Dict[str, Any]:
    """
    Get the params for a get_table_range call, not including the file_path param, as we transpile that specially,
    because it might have to be a variable.
    """

    if start_condition['type'] not in EXCEL_RANGE_START_CONDITIONS:
        raise ValueError(f'Invalid start condition type: {start_condition["type"]}')
    if end_condition['type'] not in EXCEL_RANGE_END_CONDTIONS:
        raise ValueError(f'Invalid end condition type: {end_condition["type"]}')
    if column_end_condition['type'] not in EXCEL_RANGE_COLUMN_END_CONDITIONS:
        raise ValueError(f'Invalid column end condition type: {column_end_condition["type"]}')
    
    sheet_type = sheet['type']
    if sheet_type == EXCEL_SHEET_TYPE_SHEET_NAME:
        sheet_name = sheet['value']
        sheet_index = None
    elif sheet_type == EXCEL_SHEET_TYPE_SHEET_INDEX:
        sheet_name = None
        sheet_index = sheet['value']
    else:
        raise ValueError(f'Invalid sheet type: {sheet_type}')

    upper_left_value = start_condition['value'] if start_condition['type'] == EXCEL_RANGE_START_CONDITION_UPPER_LEFT_VALUE else None
    upper_left_value_starts_with = start_condition['value'] if start_condition['type'] == EXCEL_RANGE_START_CONDITION_UPPER_LEFT_VALUE_STARTS_WITH else None
    upper_left_value_contains = start_condition['value'] if start_condition['type'] == EXCEL_RANGE_START_CONDITION_UPPER_LEFT_VALUE_CONTAINS else None

    bottom_left_value = end_condition['value'] if end_condition['type'] == EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE else None
    bottom_left_value_starts_with = end_condition['value'] if end_condition['type'] == EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE_STARTS_WITH else None
    bottom_left_value_contains = end_condition['value'] if end_condition['type'] == EXCEL_RANGE_END_CONDITION_BOTTOM_LEFT_CORNER_VALUE_CONTAINS else None
    bottom_left_consecutive_empty_cells = end_condition['value'] if end_condition['type'] == EXCEL_RANGE_END_CONDITIONAL_BOTTOM_LEFT_CORNER_CONSECUTIVE_EMPTY_CELLS else None
    bottom_left_consecutive_empty_cells_in_first_column = end_condition['value'] if end_condition['type'] == EXCEL_RANGE_END_CONDITIONAL_BOTTOM_LEFT_CORNER_CONSECUTIVE_EMPTY_CELLS_IN_FIRST_COLUMN else None
    row_entirely_empty = True if end_condition['type'] == EXCEL_RANGE_END_CONDITION_ROW_ENTIRELY_EMPTY else None
    cumulative_number_of_empty_rows = end_condition['value'] if end_condition['type'] == EXCEL_RANGE_END_CONDITION_CUMULATIVE_NUMBER_OF_EMPTY_ROWS else None

    num_columns = column_end_condition['value'] if column_end_condition['type'] == EXCEL_RANGE_COLUMN_END_CONDITION_NUM_COLUMNS else None

    all_params = {
        'sheet_name': sheet_name,
        'sheet_index': sheet_index,
        'upper_left_value': upper_left_value,
        'upper_left_value_starts_with': upper_left_value_starts_with,
        'upper_left_value_contains': upper_left_value_contains,
        'bottom_left_corner_consecutive_empty_cells': bottom_left_consecutive_empty_cells,
        'bottom_left_consecutive_empty_cells_in_first_column': bottom_left_consecutive_empty_cells_in_first_column,
        'bottom_left_value': bottom_left_value,
        'bottom_left_value_starts_with': bottom_left_value_starts_with,
        'bottom_left_value_contains': bottom_left_value_contains,
        'row_entirely_empty': row_entirely_empty,
        'cumulative_number_of_empty_rows': cumulative_number_of_empty_rows,
        'num_columns': num_columns
    }

    # Return only non-None params
    return {k: v for k, v in all_params.items() if v is not None}


class ExcelRangeImportCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, file_path: str, sheet: Dict[str, Union[int, str]], range_imports: List[ExcelRangeImport], convert_csv_to_xlsx: bool):
        super().__init__(prev_state, post_state)
        self.file_path = file_path
        self.sheet = sheet
        self.range_imports = range_imports
        self.convert_csv_to_xlsx = convert_csv_to_xlsx

    def get_display_name(self) -> str:
        return 'Excel Range Import'
    
    def get_description_comment(self) -> str:

        if self.sheet['type'] == EXCEL_SHEET_TYPE_SHEET_NAME:
            sheet = f"{self.sheet['value']}"
        else:
            sheet = f"sheet at index {self.sheet['value']}"
        
        return f"Imported {len(self.range_imports)} dataframes from {sheet} in {self.file_path}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        code = []

        transpiled_sheet_name = column_header_to_transpiled_code(self.sheet['value'])

        if self.convert_csv_to_xlsx:
            code.append(f'xlsx_file_path = convert_csv_file_to_xlsx_file(\'{self.file_path}\', {transpiled_sheet_name})')
            transpiled_file_path = f'xlsx_file_path'
        else:
            transpiled_file_path = f'r\'{self.file_path}\''


        for idx, range_import in enumerate(self.range_imports):

            sheet_index = len(self.prev_state.dfs) + idx
            df_name = self.post_state.df_names[sheet_index]

            # If it's an explicit range, then just import that exact range
            if range_import['type'] == EXCEL_RANGE_IMPORT_TYPE_RANGE:
                _range = range_import['value'] #type: ignore
                skiprows, nrows, usecols = get_read_excel_params_from_range(_range)
                
                code.append(
                    f'{df_name} = pd.read_excel({transpiled_file_path}, sheet_name={transpiled_sheet_name}, skiprows={skiprows}, nrows={nrows}, usecols=\'{usecols}\')'
                )

            else:
                # Otherwise, if you're importing based on values, we generate dynamic code
                start_condition = range_import['start_condition'] # type: ignore
                end_condition = range_import['end_condition'] #type: ignore
                column_end_condition = range_import['column_end_condition'] #type: ignore

                params = get_table_range_params(self.sheet, start_condition, end_condition, column_end_condition)
                params_code = param_dict_to_code(params, as_single_line=True)

                code.extend([
                    f'_range = get_table_range({transpiled_file_path}, {params_code})',
                    'skiprows, nrows, usecols = get_read_excel_params_from_range(_range)',
                    f'{df_name} = pd.read_excel({transpiled_file_path}, sheet_name={transpiled_sheet_name}, skiprows=skiprows, nrows=nrows, usecols=usecols)'
                ])
                

            # Add a new line in between different imports otherwise the code looks bad
            if idx < len(self.range_imports) - 1:
                code.append('')

        return code, ['import pandas as pd']

    def get_created_sheet_indexes(self) -> Optional[List[int]]:
        return [i for i in range(len(self.post_state.dfs) - len(self.range_imports), len(self.post_state.dfs))]

    def _combine_right_with_excel_range_import_code_chunk(self, excel_range_import_code_chunk: "ExcelRangeImportCodeChunk") -> Optional[CodeChunk]:
        if excel_range_import_code_chunk.file_path == self.file_path and excel_range_import_code_chunk.sheet == self.sheet:
            new_range_imports = copy(self.range_imports)
            new_range_imports.extend(excel_range_import_code_chunk.range_imports)

            return ExcelRangeImportCodeChunk(
                self.prev_state,
                excel_range_import_code_chunk.post_state,
                self.file_path,
                self.sheet,
                new_range_imports,
                self.convert_csv_to_xlsx
            )

        return None


    def combine_right(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, ExcelRangeImportCodeChunk):
            return self._combine_right_with_excel_range_import_code_chunk(other_code_chunk)

        return None
    
    def get_parameterizable_params(self) -> List[Tuple[str, str]]:
        return [(f'r{column_header_to_transpiled_code(self.file_path)}', 'file_name')]
    