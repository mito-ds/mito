
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Dict, List, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import TAB, get_column_header_as_transpiled_code

from mitosheet.transpiler.transpile_utils import get_param_dict_as_code
from mitosheet.types import ParamSubtype, ParamType, ParamValue

from mitosheet.utils import (
    get_conditional_formats_objects_to_export_to_excel, 
    get_number_formats_objects_to_export_to_excel
)

# This is a helper function that generates the code for formatting the excel sheet
def get_format_code(state: State, sheet_index_to_export_location: Dict[int, str]) -> list:
    code = []
    formats = state.df_formats
    for sheet_index, export_location in sheet_index_to_export_location.items():
        format = formats[sheet_index]
        # We need to convert the column IDs to column letters
        # for conditional formats to export to excel
        conditional_formats = get_conditional_formats_objects_to_export_to_excel(
            format.get('conditional_formats'),
            column_id_map=state.column_ids,
            sheet_index=sheet_index
        )
        df = state.dfs[sheet_index]
        number_formats = get_number_formats_objects_to_export_to_excel(df, format.get('columns'))
        params = {
            'header_background_color': format.get('headers', {}).get('backgroundColor'),
            'header_font_color': format.get('headers', {}).get('color'),
            'even_background_color': format.get('rows', {}).get('even', {}).get('backgroundColor'),
            'even_font_color': format.get('rows', {}).get('even', {}).get('color'),
            'odd_background_color': format.get('rows', {}).get('odd', {}).get('backgroundColor'),
            'odd_font_color': format.get('rows', {}).get('odd', {}).get('color'),
            'conditional_formats': conditional_formats,
            'number_formats': number_formats,
        }
        param_dict = {
            key: value for key, value in params.items()
            if value is not None
        }
        if param_dict == {}:
            continue

        params_code = get_param_dict_as_code(param_dict, tab_level=1)
        code.append(f'{TAB}add_formatting_to_excel_sheet(writer, "{export_location}", {state.df_names[sheet_index]}, {params_code})')
    return code


class ExportToFileCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, export_type: str, file_name: str, sheet_index_to_export_location: Dict[int, str], sheet_index_to_df_name: Dict[int, str], export_formatting: bool=False):
        super().__init__(prev_state)
        self.export_type = export_type
        self.file_name = file_name
        self.sheet_index_to_export_location = sheet_index_to_export_location
        self.sheet_index_to_df_name = sheet_index_to_df_name
        self.export_formatting = export_formatting

    def get_display_name(self) -> str:
        return 'Export To File'

    def get_description_comment(self) -> str:
        return f"Exports {len(self.sheet_index_to_export_location)} to file {self.file_name}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        if self.export_type == 'csv':
            return [
                f"{self.sheet_index_to_df_name[sheet_index]}.to_csv(r{get_column_header_as_transpiled_code(export_location)}, index=False)"
                for sheet_index, export_location in self.sheet_index_to_export_location.items()
            ], []
        
        elif self.export_type == 'excel':
            format_code = get_format_code(self.prev_state, self.sheet_index_to_export_location) if self.export_formatting else []

            return [f"with pd.ExcelWriter(r{get_column_header_as_transpiled_code(self.file_name)}, engine=\"openpyxl\") as writer:"] + [
                f'{TAB}{self.sheet_index_to_df_name[sheet_index]}.to_excel(writer, sheet_name="{export_location}", index={False})'
                for sheet_index, export_location in self.sheet_index_to_export_location.items()
            ] + format_code, ['import pandas as pd']
        else:
            raise ValueError(f'Not a valid file type: {self.export_type}')
        
    def get_parameterizable_params(self) -> List[Tuple[ParamValue, ParamType, ParamSubtype]]:
        if self.export_type == 'csv':
            return [
                (f"r{get_column_header_as_transpiled_code(export_location)}", 'export', 'file_name_export_csv') for export_location in self.sheet_index_to_export_location.values()
            ]
        elif self.export_type == 'excel':
            return [(f"r{get_column_header_as_transpiled_code(self.file_name)}", 'export', 'file_name_export_excel')]
        else:
            raise ValueError(f'Not a valid file type: {self.export_type}')
