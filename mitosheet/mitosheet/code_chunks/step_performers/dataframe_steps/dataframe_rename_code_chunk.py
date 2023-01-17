#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State


class DataframeRenameCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, old_dataframe_name: str, new_dataframe_name: str):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.old_dataframe_name = old_dataframe_name
        self.new_dataframe_name = new_dataframe_name

    def get_display_name(self) -> str:
        return 'Renamed Dataframe'
    
    def get_description_comment(self) -> str:
        return f'Renamed {self.old_dataframe_name} to {self.new_dataframe_name}'

    def get_code(self) -> Tuple[List[str], List[str]]:
        if self.old_dataframe_name == self.new_dataframe_name:
            return [], []

        return [f'{self.post_state.df_names[self.sheet_index]} = {self.old_dataframe_name}'], []

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]