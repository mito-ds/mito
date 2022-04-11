#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk


class DataframeDeleteCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Deleted Dataframe'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        df_name = self.prev_state.df_names[sheet_index]
        return f'Deleted {df_name}'

    def get_code(self) -> List[str]:
        old_dataframe_name = self.get_param('old_dataframe_name')

        return [f'del {old_dataframe_name}']