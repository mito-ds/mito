
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import re
from distutils.version import LooseVersion
from typing import List, Tuple, Any
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID
from mitosheet.transpiler.transpile_utils import get_column_header_list_as_transpiled_code, get_column_header_map_as_code_string
from mitosheet.state import State

import pandas as pd

from mitosheet.errors import MitoError


def convert_to_original_type_or_str(column: str, original_type: type) -> Any:
    try:
        return original_type(column)
    except:
        return column


class ReplaceCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, sheet_index: int, column_ids: List[ColumnID], search_value: str, replace_value: str):
        super().__init__(prev_state)
        self.sheet_index = sheet_index
        self.column_ids = column_ids
        self.search_value = search_value
        self.replace_value = replace_value
        self.df = self.prev_state.dfs[self.sheet_index]
        self.df_name = self.prev_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'Replace'
    
    def get_description_comment(self) -> str:
        return f"Replace {self.search_value} with {self.replace_value} in {self.prev_state.df_names[self.sheet_index]}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        search_value = self.search_value
        replace_value = self.replace_value
        column_ids = self.column_ids
        df_name = self.df_name
        df_name_with_selected_columns = self.df_name
        sheet_index = self.sheet_index
        df = self.df
        column_headers: Any = []

        if (column_ids is not None and len(column_ids) > 0):
            column_headers = self.prev_state.column_ids.get_column_headers_by_ids(sheet_index, column_ids)
            df_name_with_selected_columns = f'{self.df_name}[{get_column_header_list_as_transpiled_code(column_headers)}]'
            df = self.df[column_headers]
        else:
            column_headers = df.columns.to_list()

        # The shorter code chunk is for dataframes that *don't* have any boolean columns
        # Boolean columns are a special case, because when we convert them to str then back
        # to bool, they all become True. So we have to convert them back to bool with a custom
        # function.
        code_chunk = [
            f'{df_name_with_selected_columns} = {df_name_with_selected_columns}.astype(str).replace("(?i){search_value}", "{replace_value}", regex=True).astype({df_name_with_selected_columns}.dtypes.to_dict())',
        ]

        if (any(df.dtypes == 'timedelta') and LooseVersion(pd.__version__) < LooseVersion("1.4")):
            raise MitoError(
                'version_error',
                'Pandas version error',
                'This version of pandas doesn\'t support replacing values in timedelta columns. Please upgrade to pandas 1.2 or later.',
            )
        if any(df.dtypes == bool):
            code_chunk = [
                f"non_bool_cols, bool_cols = {df_name_with_selected_columns}.select_dtypes(exclude='bool'), {df_name_with_selected_columns}.select_dtypes(include='bool')",
                f"{df_name}[non_bool_cols.columns] = non_bool_cols.astype(str).replace('(?i){search_value}', '{replace_value}', regex=True).astype(non_bool_cols.dtypes.to_dict())",
                f"{df_name}[bool_cols.columns] = bool_cols.astype(str).replace('(?i){search_value}', '{replace_value}', regex=True).applymap(cast_string_to_bool).astype(bool)",
            ]

        # Then, we always replace the search_value inside the column headers
        string_value_regex = re.compile(search_value, re.IGNORECASE)

        new_columns = [convert_to_original_type_or_str(re.sub(string_value_regex, replace_value, str(column)), type(column)) for column in column_headers]
        column_rename_map = dict(zip(column_headers, new_columns))
        column_rename_map = {k: v for k, v in column_rename_map.items() if k != v}
        if len(column_rename_map) > 0:
            code_chunk.append(f"{df_name}.rename(columns={get_column_header_map_as_code_string(column_rename_map)}, inplace=True)")
        return code_chunk, []

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]
    