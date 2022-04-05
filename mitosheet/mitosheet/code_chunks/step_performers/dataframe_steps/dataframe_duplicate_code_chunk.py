#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk


class DataframeDuplicateCodeChunk(CodeChunk):

    def transpile(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')

        old_df_name = self.post_state.df_names[sheet_index]
        new_df_name = self.post_state.df_names[len(self.post_state.dfs) - 1]

        return [f'{new_df_name} = {old_df_name}.copy(deep=True)']
