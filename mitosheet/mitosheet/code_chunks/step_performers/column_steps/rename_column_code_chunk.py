#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code


class RenameColumnCodeChunk(CodeChunk):

    def transpile(self) -> List[str]:

        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        new_column_header = self.get_param('new_column_header')
        
        # Process the no-op if the header is empty
        if new_column_header == '':
            return []

        df_name = self.post_state.df_names[sheet_index]
        old_column_header = self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)

        transpiled_old_column_header = column_header_to_transpiled_code(old_column_header)
        transpiled_new_column_header = column_header_to_transpiled_code(new_column_header)
        rename_dict = "{" + f'{transpiled_old_column_header}: {transpiled_new_column_header}' + "}"

        rename_string = f'{df_name}.rename(columns={rename_dict}, inplace=True)'
        return [rename_string]
