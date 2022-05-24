#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code, column_header_map_to_string, column_header_to_transpiled_code


class FillNaCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Filled NaN Values'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        column_ids = self.get_param('column_ids')
        df_name = self.post_state.df_names[sheet_index]
        return f'Filled NaN values in {len(column_ids)} columns in {df_name}'

    def get_code(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')
        column_ids = self.get_param('column_ids')
        fill_method = self.get_param('fill_method')
        fill_method_type = fill_method['type']

        df = self.post_state.dfs[sheet_index]
        df_name = self.post_state.df_names[sheet_index]
        column_headers = self.post_state.column_ids.get_column_headers_by_ids(sheet_index, column_ids)
        # If the user is filling NaN values across the entire dataframe, we generate nice code
        # that does this specifically, rather than just doing the columns they picked
        full_dataframe = len(df.columns) == len(column_headers)

        if fill_method_type == 'value':
            if full_dataframe:
                
                return [f"{df_name}.fillna({column_header_to_transpiled_code(fill_method['value'])}, inplace=True)"]
            else:
                values = {column_header: fill_method['value'] for column_header in column_headers}
                values_string = column_header_map_to_string(values) # this function is misnamed, but works for us
                return [f"{df_name}.fillna({values_string}, inplace=True)"]
        else:
            if fill_method_type == 'ffill':
                param_string = "method='ffill'"
            elif fill_method_type == 'bfill':
                param_string = "method='bfill'"
            elif fill_method_type == 'mean':
                if full_dataframe:
                    param_string = f"{df_name}.mean(numeric_only=False)"
                else:
                    param_string = f"{df_name}[columns_to_fill_nan].mean(numeric_only=False)"
            elif fill_method_type == 'median':
                if full_dataframe:
                    param_string = f"{df_name}.median(numeric_only=False)"
                else:
                    param_string = f"{df_name}[columns_to_fill_nan].median(numeric_only=False)"

            if full_dataframe:
                return [f"{df_name}.fillna({param_string}, inplace=True)"]
            else:
                column_headers_list_str = column_header_list_to_transpiled_code(column_headers)
                return [
                    f"columns_to_fill_nan = {column_headers_list_str}",
                    f"{df_name}[columns_to_fill_nan] = {df_name}[columns_to_fill_nan].fillna({param_string})"
                ]


        return []

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]