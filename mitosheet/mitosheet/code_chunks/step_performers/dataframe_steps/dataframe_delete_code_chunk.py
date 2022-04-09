#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List, Optional

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.no_op_code_chunk import NoOpCodeChunk

class DataframeDeleteCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Deleted Dataframe'
    
    def get_description_comment(self) -> str:
        sheet_indexes = self.get_param('sheet_indexes')
        df_names = [self.prev_state.df_names[sheet_index] for sheet_index in sheet_indexes]
        return f'Deleted {", ".join(df_names)}'

    def get_code(self) -> List[str]:
        old_dataframe_names = self.get_param('old_dataframe_names')
        return [f'del {old_dataframe_name}' for old_dataframe_name in old_dataframe_names]

    def _combine_right_dataframe_delete(self, other_code_chunk: "DataframeDeleteCodeChunk") -> CodeChunk:
        first_sheet_indexes = self.get_param('sheet_indexes')
        second_sheet_indexes = other_code_chunk.get_param('sheet_indexes')

        # Because we don't have sheet ids, we need to bump any deleted dataframes
        # that come later, so that they have the correct index now
        for first_sheet_index in first_sheet_indexes:
            for index, second_sheet_index in enumerate(second_sheet_indexes):
                if first_sheet_index <= second_sheet_index:
                    second_sheet_indexes[index] = second_sheet_index + 1

        sheet_indexes = first_sheet_indexes + second_sheet_indexes
        old_dataframe_names = self.get_param('old_dataframe_names') + other_code_chunk.get_param('old_dataframe_names')

        return DataframeDeleteCodeChunk(
            self.prev_state,
            other_code_chunk.post_state,
            {
                'sheet_indexes': sheet_indexes,
                'old_dataframe_names': old_dataframe_names,
            },
            {}
        )


    def combine_right(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, DataframeDeleteCodeChunk):
            return self._combine_right_dataframe_delete(other_code_chunk)
        
        return None

    def combine_left(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        sheet_indexes = self.get_param('sheet_indexes')
        if other_code_chunk.creates_sheet_indexes(sheet_indexes):
            return NoOpCodeChunk(other_code_chunk.prev_state, self.post_state, {}, {})
        elif other_code_chunk.edits_sheet_indexes(sheet_indexes):
            return self
        return None


