
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Dict, List, Optional

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.excel_utils import (get_column_from_column_index,
                                   get_col_and_row_indexes_from_range)
from mitosheet.state import State
from mitosheet.types import ExcelRangeImport


class ExcelRangeImportCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, file_path: str, sheet_name: str, df_name_to_ranges: Dict[str, str]):
        super().__init__(prev_state, post_state, {}, {})
        self.file_path = file_path
        self.sheet_name = sheet_name
        self.df_name_to_ranges = df_name_to_ranges

    def get_display_name(self) -> str:
        return 'Excel Range Import'
    
    def get_description_comment(self) -> str:
        
        return f"Imported {len(self.df_name_to_ranges)} dataframes from {self.sheet_name} in {self.file_path}"

    def get_code(self) -> List[str]:
        code = ['import pandas as pd']
        for df_name, _range in self.df_name_to_ranges.items():
            ((start_col_index, start_row_index), (end_col_index, end_row_index)) = get_col_and_row_indexes_from_range(_range)
            nrows = end_row_index - start_row_index
            usecols = get_column_from_column_index(start_col_index) + ':' + get_column_from_column_index(end_col_index)
            
            code.append(
                f'{df_name} = pd.read_excel(\'{self.file_path}\', sheet_name=\'{self.sheet_name}\', skiprows={start_row_index}, nrows={nrows}, usecols=\'{usecols}\')'
            )

        return code

    def get_created_sheet_indexes(self) -> Optional[List[int]]:
        return [i for i in range(len(self.post_state.dfs) - len(self.df_name_to_ranges), len(self.post_state.dfs))]

    def get_edited_sheet_indexes(self) -> List[int]:
        return []
    