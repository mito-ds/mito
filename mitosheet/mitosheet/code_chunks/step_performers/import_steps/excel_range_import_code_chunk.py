
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Dict, List, Optional, Tuple
from collections import OrderedDict

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.excel_utils import (get_column_from_column_index,
                                   get_col_and_row_indexes_from_range)
from mitosheet.state import State
from mitosheet.code_chunks.step_performers.dataframe_steps.dataframe_rename_code_chunk import DataframeRenameCodeChunk


class ExcelRangeImportCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, file_path: str, sheet_name: str, sheet_index_to_df_name_and_range: Dict[int, Tuple[str, str]]):
        super().__init__(prev_state, post_state, {}, {})
        self.file_path = file_path
        self.sheet_name = sheet_name
        self.sheet_index_to_df_name_and_range = sheet_index_to_df_name_and_range

    def get_display_name(self) -> str:
        return 'Excel Range Import'
    
    def get_description_comment(self) -> str:
        
        return f"Imported {len(self.sheet_index_to_df_name_and_range)} dataframes from {self.sheet_name} in {self.file_path}"

    def get_code(self) -> List[str]:
        code = ['import pandas as pd']
        for df_name, _range in self.sheet_index_to_df_name_and_range.values():
            ((start_col_index, start_row_index), (end_col_index, end_row_index)) = get_col_and_row_indexes_from_range(_range)
            nrows = end_row_index - start_row_index
            usecols = get_column_from_column_index(start_col_index) + ':' + get_column_from_column_index(end_col_index)
            
            code.append(
                f'{df_name} = pd.read_excel(\'{self.file_path}\', sheet_name=\'{self.sheet_name}\', skiprows={start_row_index}, nrows={nrows}, usecols=\'{usecols}\')'
            )

        return code

    def get_created_sheet_indexes(self) -> Optional[List[int]]:
        return list(self.sheet_index_to_df_name_and_range.keys())

    def get_edited_sheet_indexes(self) -> List[int]:
        return []

    def _combine_right_with_dataframe_rename_code_chunk(self, dataframe_rename_code_chunk: DataframeRenameCodeChunk) -> Optional[CodeChunk]:
        sheet_index = dataframe_rename_code_chunk.get_param('sheet_index')
        new_dataframe_name = dataframe_rename_code_chunk.get_param('new_dataframe_name')

        print(sheet_index, self.sheet_index_to_df_name_and_range)

        if sheet_index in self.sheet_index_to_df_name_and_range:
            print("123")
            new_sheet_index_to_df_name_and_range = copy(self.sheet_index_to_df_name_and_range)
            new_sheet_index_to_df_name_and_range[sheet_index] = (new_dataframe_name, self.sheet_index_to_df_name_and_range[sheet_index][1])
            return ExcelRangeImportCodeChunk(
                self.prev_state,
                dataframe_rename_code_chunk.post_state,
                self.file_path,
                self.sheet_name,
                new_sheet_index_to_df_name_and_range
            )

        return None

    def combine_right(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        print("HERE123")
        if isinstance(other_code_chunk, DataframeRenameCodeChunk):
            print("AND MORE")
            return self._combine_right_with_dataframe_rename_code_chunk(other_code_chunk)

        return super().combine_right(other_code_chunk)
    