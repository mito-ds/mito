#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Dict, List, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.types import ColumnHeader


class BulkOldRenameCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, column_header_renames_list: List[Dict[ColumnHeader, ColumnHeader]]):
        super().__init__(prev_state, post_state)
        self.column_header_renames_list = column_header_renames_list

    def get_display_name(self) -> str:
        return 'Bulk rename'
    
    def get_description_comment(self) -> str:
        return f'Renamed headers for compatibility with previous Mito versions'

    def get_code(self) -> Tuple[List[str], List[str]]:

        code = []
        for sheet_index, df_name in enumerate(self.post_state.df_names):
            renames = self.column_header_renames_list[sheet_index]
            if len(renames) == 0:
                continue

            code.append(
                f'{df_name}.rename(columns={json.dumps(renames)}, inplace=True)'
            )

        if len(code) > 0:
            code.insert(0, '# Rename headers to make them work with Mito')

        return code, []