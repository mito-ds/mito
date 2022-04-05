#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import \
    column_header_list_to_transpiled_code


class DeleteColumnCodeChunk(CodeChunk):

    def transpile(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')
        column_ids = self.get_param('column_ids')

        df_name = self.post_state.df_names[sheet_index]
        column_headers_list_string = column_header_list_to_transpiled_code(
            [self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id) for column_id in column_ids]
        )

        return [f'{df_name}.drop({column_headers_list_string}, axis=1, inplace=True)']
