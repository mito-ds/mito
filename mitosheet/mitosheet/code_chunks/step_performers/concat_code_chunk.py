#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk


class ConcatCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Concatenated'
    
    def get_description_comment(self) -> str:
        sheet_indexes = self.get_param('sheet_indexes')
        df_name = self.post_state.df_names[len(self.post_state.df_names) - 1]
        return f'Concatenated {len(sheet_indexes)} into dataframes into {df_name}'

    def get_code(self) -> List[str]:
        join = self.get_param('join')
        ignore_index = self.get_param('ignore_index')
        sheet_indexes = self.get_param('sheet_indexes')

        df_names_to_concat = [self.post_state.df_names[sheet_index] for sheet_index in sheet_indexes]
        df_new_name = self.post_state.df_names[len(self.post_state.dfs) - 1]

        if len(df_names_to_concat) == 0:
            return [f'{df_new_name} = pd.DataFrame()']
        else:
            return [
                f"{df_new_name} = pd.concat([{', '.join(df_names_to_concat)}], join=\'{join}\', ignore_index={ignore_index})"
            ]

    def get_created_sheet_indexes(self) -> List[int]:
        return [len(self.post_state.dfs) - 1]