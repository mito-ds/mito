#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import DEFAULT_DECIMAL
from mitosheet.step_performers.utils import get_param
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code


class ExcelImportCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Imported'
    
    def get_description_comment(self) -> str:
        file_name = self.get_param('file_name')
        sheet_names = self.get_param('sheet_names')
        return f'Imported {", ".join(sheet_names)} from {file_name}'

    def get_code(self) -> List[str]:
        file_name = self.get_param('file_name')
        sheet_names = self.get_param('sheet_names')
        
        read_excel_params = build_read_excel_params(self.params)

        read_excel_line = f'sheet_df_dictonary = pd.read_excel(r\'{file_name}\', engine=\'openpyxl\''
        for key, value in read_excel_params.items():
            # We use this slighly misnamed function to make sure values get transpiled right
            read_excel_line += f", {key}={column_header_to_transpiled_code(value)}"
        read_excel_line += ')'

        df_definitions = []
        for index, sheet_name in enumerate(sheet_names):
            adjusted_index = len(self.post_state.df_names) - len(sheet_names) + index
            df_definitions.append(
                f'{self.post_state.df_names[adjusted_index]} = sheet_df_dictonary[\'{sheet_name}\']'
            )

        return [
            'import pandas as pd',
            read_excel_line
        ] + df_definitions

    def get_created_sheet_indexes(self) -> List[int]:
        sheet_names = self.get_param('sheet_names')
        return [i for i in range(len(self.post_state.dfs) - len(sheet_names), len(self.post_state.dfs))]

    
def build_read_excel_params(params: Dict[str, Any]) -> Dict[str, Any]:
    sheet_names: List[str] = get_param(params, 'sheet_names')
    has_headers: bool = get_param(params, 'has_headers')
    skiprows: int = get_param(params, 'skiprows')
    decimal: str = get_param(params, 'decimal')

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