#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk


class DataframeRenameCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Renamed Dataframe'
    
    def get_description_comment(self) -> str:
        old_dataframe_name = self.get_param('old_dataframe_name')
        new_dataframe_name = self.get_param('new_dataframe_name')
        return f'Renamed {old_dataframe_name} to {new_dataframe_name}'

    def get_code(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')
        old_dataframe_name = self.get_param('old_dataframe_name')
        new_dataframe_name = self.get_param('new_dataframe_name')

        if old_dataframe_name == new_dataframe_name:
            return []

        return [f'{self.post_state.df_names[sheet_index]} = {old_dataframe_name}']

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]