#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code, column_header_map_to_string


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
        full_dataframe = len(df.columns) == column_headers

        if fill_method_type == 'value':
            if full_dataframe:
                return [f"{df_name}.fillna({fill_method['value']}, inplace=True)"]
            else:
                values = {column_header: fill_method['value'] for column_header in column_headers}
                values_string = column_header_map_to_string(values) # this function is misnamed, but works for us
                return [f"{df_name}.fillna({values_string}, inplace=True)"]

        elif fill_method_type == 'ffill':
            if full_dataframe:
                return [f"{df_name}.fillna(method='ffill', inplace=True)"]
            else:
                column_headers_list_str = column_header_list_to_transpiled_code(column_headers)
                return [f"{df_name}[{column_headers_list_str}] = {df_name}[{column_headers_list_str}].fillna(method='ffill')"]

        elif fill_method_type == 'bfill':
            if full_dataframe:
                return [f"{df_name}.fillna(method='bfill', inplace=True)"]
            else:
                column_headers_list_str = column_header_list_to_transpiled_code(column_headers)
                return [f"{df_name}[{column_headers_list_str}] = {df_name}[{column_headers_list_str}].fillna(method='bfill')"]

        elif fill_method_type == 'mean':
            if full_dataframe:
                return [f"{df_name}.fillna({df_name}.mean(), inplace=True)"]
            else:
                column_headers_list_str = column_header_list_to_transpiled_code(column_headers)
                # TODO: in all of these, maybe I should save a temp variable... I think yes!
                return [f"{df_name}[{column_headers_list_str}] = {df_name}[{column_headers_list_str}].fillna({df_name}[{column_headers_list_str}].mean())"]

        elif fill_method_type == 'median':
            if full_dataframe:
                return [f"{df_name}.fillna({df_name}.median(), inplace=True)"]
            else:
                column_headers_list_str = column_header_list_to_transpiled_code(column_headers)
                return [f"{df_name}[{column_headers_list_str}] = {df_name}[{column_headers_list_str}].fillna({df_name}[{column_headers_list_str}].median())"]

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]