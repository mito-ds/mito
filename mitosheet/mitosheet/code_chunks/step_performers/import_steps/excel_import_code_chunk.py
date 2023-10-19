#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import DEFAULT_DECIMAL
from mitosheet.state import State
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.transpiler.transpile_utils import get_column_header_as_transpiled_code
from mitosheet.types import ParamSubtype, ParamType, ParamValue


class ExcelImportCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, file_name: str, sheet_names: List[str], has_headers: bool, skiprows: int, decimal: str, new_df_names: List[str]):
        super().__init__(prev_state)
        self.file_name = file_name
        self.sheet_names = sheet_names
        self.has_headers = has_headers
        self.skiprows = skiprows
        self.decimal = decimal
        self.new_df_names = new_df_names

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

        tranpiled_file_name = get_column_header_as_transpiled_code(self.file_name)
        read_excel_line = f'sheet_df_dictonary = pd.read_excel(r{tranpiled_file_name}, engine=\'openpyxl\''
        for key, value in read_excel_params.items():
            # We use this slighly misnamed function to make sure values get transpiled right
            read_excel_line += f", {key}={get_column_header_as_transpiled_code(value)}"
        read_excel_line += ')'

        df_definitions = []
        for index, sheet_name in enumerate(self.sheet_names):
            df_definitions.append(
                f'{self.new_df_names[index]} = sheet_df_dictonary[\'{sheet_name}\']'
            )

        return [
            read_excel_line
        ] + df_definitions, ['import pandas as pd']

    def get_created_sheet_indexes(self) -> List[int]:
        return [i for i in range(len(self.prev_state.dfs), len(self.prev_state.dfs) + len(self.sheet_names))]
    
    def get_parameterizable_params(self) -> List[Tuple[ParamValue, ParamType, ParamSubtype]]:
        return [(f'r{get_column_header_as_transpiled_code(self.file_name)}', 'import', 'file_name_import_excel')]

    
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