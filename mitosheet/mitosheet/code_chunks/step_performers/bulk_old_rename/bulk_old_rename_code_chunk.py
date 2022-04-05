#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk


class BulkOldRenameCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Bulk rename'
    
    def get_description_comment(self) -> str:
        return f'Renamed headers for compatibility with previous Mito versions'

    def get_code(self) -> List[str]:
        column_header_renames_list = self.get_execution_data('column_header_renames_list')

        code = []
        for sheet_index, df_name in enumerate(self.post_state.df_names):
            renames = column_header_renames_list[sheet_index]
            if len(renames) == 0:
                continue

            code.append(
                f'{df_name}.rename(columns={json.dumps(renames)}, inplace=True)'
            )

        if len(code) > 0:
            code.insert(0, '# Rename headers to make them work with Mito')

        return code