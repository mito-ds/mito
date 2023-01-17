#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import DEFAULT_DECIMAL
from mitosheet.state import State
from mitosheet.step_performers.utils import get_param
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code


class ExcelImportCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, file_name: str, sheet_names: List[str], has_headers: bool, skiprows: int, decimal: str):
        super().__init__(prev_state, post_state)
        self.file_name = file_name
        self.sheet_names = sheet_names
        self.has_headers = has_headers
        self.skiprows = skiprows
        self.decimal = decimal

    def get_display_name(self) -> str:
        return 'Imported'
    
    def get_description_comment(self) -> str:
        return f'Imported {", ".join(self.sheet_names)} from {self.file_name}'

    def get_code(self) -> Tuple[List[str], List[str]]:
        read_excel_params = build_read_excel_params(
            self.sheet_names,
            self.has_headers,
            self.skiprows,
            self.decimal
        )

        read_excel_line = f'sheet_df_dictonary = pd.read_excel(r\'{self.file_name}\', engine=\'openpyxl\''
        for key, value in read_excel_params.items():
            # We use this slighly misnamed function to make sure values get transpiled right
            read_excel_line += f", {key}={column_header_to_transpiled_code(value)}"
        read_excel_line += ')'

        df_definitions = []
        for index, sheet_name in enumerate(self.sheet_names):
            adjusted_index = len(self.post_state.df_names) - len(self.sheet_names) + index
            df_definitions.append(
                f'{self.post_state.df_names[adjusted_index]} = sheet_df_dictonary[\'{sheet_name}\']'
            )

        return [
            read_excel_line
        ] + df_definitions, ['import pandas as pd']

    def get_created_sheet_indexes(self) -> List[int]:
        return [i for i in range(len(self.post_state.dfs) - len(self.sheet_names), len(self.post_state.dfs))]

    
def build_read_excel_params(
    sheet_names: List[str],
    has_headers: bool,
    skiprows: int,
    decimal: str
) -> Dict[str, Any]:
    read_excel_params = {
        'sheet_name': sheet_names,
        'skiprows': skiprows,
    }

    # Get rid of the headers if it doesn't have them
    if not has_headers:
        read_excel_params['header'] = None

    if decimal is not None and decimal is not DEFAULT_DECIMAL: 
        read_excel_params['decimal'] = decimal

    return read_excel_params