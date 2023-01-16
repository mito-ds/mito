
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.excel_utils import get_df_name_as_valid_sheet_name
from mitosheet.state import State
from mitosheet.types import ColumnID


class ExportToFileCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, _type: str, sheet_indexes: List[int], file_name: str):
        super().__init__(prev_state, post_state)
        self._type = _type
        self.sheet_indexes = sheet_indexes
        self.file_name = file_name # TODO: gracefulyl handle if the user appends a .csv or .xlsx or whatever

    def get_display_name(self) -> str:
        return 'Export To File'
    
    def get_description_comment(self) -> str:

        return f"Exports {len(self.sheet_indexes)} to file {self.file_name}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        if self._type == 'csv':
            if len(self.sheet_indexes) == 1:
                df_name = self.post_state.df_names[self.sheet_indexes[0]]
                return [
                    f'{df_name}.to_csv("{self.file_name}.txt", index={False})',
                ], []
            else: 
                return [
                    f'{df_name}.to_csv("{self.file_name}_{df_name}.txt", index=False)' 
                    for sheet_index, df_name in enumerate(self.post_state.df_names) if sheet_index in self.sheet_indexes
                ], ['import pandas as pd']
        elif self._type == 'excel':
            if len(self.sheet_indexes) == 1:
                df_name = self.post_state.df_names[self.sheet_indexes[0]]
                return [
                    f'{df_name}.to_excel("{self.file_name}", sheet_name={get_df_name_as_valid_sheet_name(df_name)}, index={False})',
                ], []
            else: 
                df_exports = [
                    f'    {df_name}.to_excel(writer, sheet_name="{get_df_name_as_valid_sheet_name(df_name)}", index=False)' 
                    for sheet_index, df_name in enumerate(self.post_state.df_names) if sheet_index in self.sheet_indexes
                ]
                return [f'with pd.ExcelWriter("{self.file_name}") as writer:'] + df_exports, ['import pandas as pd']


        # TODO: actually generate the code here!
        return [], []
    