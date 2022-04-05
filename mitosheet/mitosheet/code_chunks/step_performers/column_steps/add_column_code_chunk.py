#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code


class AddColumnCodeChunk(CodeChunk):

    def transpile(self) -> List[str]:

        sheet_index = self.get_param('sheet_index')
        column_header = self.get_param('column_header')
        column_header_index = self.get_execution_data('column_header_index')

        transpiled_column_header = column_header_to_transpiled_code(column_header)
        column_header_index = column_header_index
        return [
            f'{self.post_state.df_names[sheet_index]}.insert({column_header_index}, {transpiled_column_header}, 0)'
        ]
