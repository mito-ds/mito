#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import get_column_header_list_as_transpiled_code, get_column_header_map_as_code_string, get_column_header_as_transpiled_code
from mitosheet.types import ColumnID


class FillNaCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, sheet_index: int, column_ids: List[ColumnID], fill_method: Dict[str, Any]):
        super().__init__(prev_state)
        self.sheet_index = sheet_index
        self.column_ids = column_ids
        self.fill_method = fill_method
        self.full_dataframe = len(self.prev_state.dfs[self.sheet_index]) == len(self.column_ids)

        self.df_name = self.prev_state.df_names[self.sheet_index]
        self.column_headers = self.prev_state.column_ids.get_column_headers_by_ids(self.sheet_index, self.column_ids)

    def get_display_name(self) -> str:
        return 'Filled NaN Values'
    
    def get_description_comment(self) -> str:
        return f'Filled NaN values in {len(self.column_ids)} columns in {self.df_name}'

    def get_code(self) -> Tuple[List[str], List[str]]:
        fill_method_type = self.fill_method['type']

        # If the user is filling NaN values across the entire dataframe, we generate nice code
        # that does this specifically, rather than just doing the columns they picked

        if fill_method_type == 'value':
            if self.full_dataframe:
                
                return [f"{self.df_name}.fillna({get_column_header_as_transpiled_code(self.fill_method['value'])}, inplace=True)"], []
            else:
                values = {column_header: self.fill_method['value'] for column_header in self.column_headers}
                values_string = get_column_header_map_as_code_string(values) # this function is misnamed, but works for us
                return [f"{self.df_name}.fillna({values_string}, inplace=True)"], []
        else:
            if fill_method_type == 'ffill':
                param_string = "method='ffill'"
            elif fill_method_type == 'bfill':
                param_string = "method='bfill'"
            elif fill_method_type == 'mean':
                if self.full_dataframe:
                    param_string = f"{self.df_name}.mean(numeric_only=False)"
                else:
                    param_string = f"{self.df_name}[columns_to_fill_nan].mean(numeric_only=False)"
            elif fill_method_type == 'median':
                if self.full_dataframe:
                    param_string = f"{self.df_name}.median(numeric_only=False)"
                else:
                    param_string = f"{self.df_name}[columns_to_fill_nan].median(numeric_only=False)"

            if self.full_dataframe:
                return [f"{self.df_name}.fillna({param_string}, inplace=True)"], []
            else:
                column_headers_list_str = get_column_header_list_as_transpiled_code(self.column_headers)
                return [
                    f"columns_to_fill_nan = {column_headers_list_str}",
                    f"{self.df_name}[columns_to_fill_nan] = {self.df_name}[columns_to_fill_nan].fillna({param_string})"
                ], []

        return [], []

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]