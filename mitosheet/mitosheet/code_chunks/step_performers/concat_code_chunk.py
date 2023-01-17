#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State


class ConcatCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, join: str, ignore_index: bool, sheet_indexes: List[int]):
        super().__init__(prev_state, post_state)
        self.join = join
        self.ignore_index = ignore_index
        self.sheet_indexes = sheet_indexes

        self.df_names_to_concat = [self.post_state.df_names[sheet_index] for sheet_index in self.sheet_indexes]
        self.new_df_name = self.post_state.df_names[len(self.post_state.df_names) - 1]

    def get_display_name(self) -> str:
        return 'Concatenated'
    
    def get_description_comment(self) -> str:
        return f'Concatenated {len(self.sheet_indexes)} into dataframes into {self.new_df_name}'

    def get_code(self) -> Tuple[List[str], List[str]]:

        if len(self.df_names_to_concat) == 0:
            return [f'{self.new_df_name} = pd.DataFrame()'], ['import pandas as pd']
        else:
            return [
                f"{self.new_df_name} = pd.concat([{', '.join(self.df_names_to_concat)}], join=\'{self.join}\', ignore_index={self.ignore_index})"
            ], ['import pandas as pd']

    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs) - 1]