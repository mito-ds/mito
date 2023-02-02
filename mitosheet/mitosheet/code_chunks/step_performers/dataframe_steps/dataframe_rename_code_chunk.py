#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
from typing import Any, Dict, List, Optional, Tuple, Union

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.import_steps.simple_import_code_chunk import SimpleImportCodeChunk
from mitosheet.code_chunks.step_performers.import_steps.excel_import_code_chunk import ExcelImportCodeChunk
from mitosheet.code_chunks.step_performers.import_steps.excel_range_import_code_chunk import ExcelRangeImportCodeChunk
from mitosheet.code_chunks.snowflake_import_code_chunk import SnowflakeImportCodeChunk
from mitosheet.code_chunks.step_performers.pivot_code_chunk import PivotCodeChunk
from mitosheet.code_chunks.step_performers.merge_code_chunk import MergeCodeChunk
from mitosheet.code_chunks.step_performers.dataframe_steps.dataframe_duplicate_code_chunk import DataframeDuplicateCodeChunk
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

    def _combine_left_with_dataframe_rename(self, dataframe_rename_code_chunk: "DataframeRenameCodeChunk") -> Optional["DataframeRenameCodeChunk"]:
        if self.sheet_index != dataframe_rename_code_chunk.sheet_index:
            return None
        
        return DataframeRenameCodeChunk(
            dataframe_rename_code_chunk.prev_state,
            self.post_state,
            dataframe_rename_code_chunk.sheet_index,
            dataframe_rename_code_chunk.old_dataframe_name,
            self.new_dataframe_name
        )

    def _combine_left_with_pivot_code_chunk(self, pivot_code_chunk: PivotCodeChunk) -> Optional[CodeChunk]:
        destination_sheet_index = pivot_code_chunk.destination_sheet_index
        if destination_sheet_index is None:
            destination_sheet_index = len(pivot_code_chunk.post_state.dfs) - 1

        if destination_sheet_index != self.sheet_index:
            return None

        return PivotCodeChunk(
            pivot_code_chunk.prev_state,
            self.post_state,
            pivot_code_chunk.sheet_index,
            pivot_code_chunk.destination_sheet_index,
            pivot_code_chunk.pivot_rows_column_ids_with_transforms,
            pivot_code_chunk.pivot_columns_column_ids_with_transforms,
            pivot_code_chunk.pivot_filters_ids,
            pivot_code_chunk.values_column_ids_map,
            pivot_code_chunk.flatten_column_headers,
            pivot_code_chunk.was_series,
        )

    def _combine_left_with_merge_code_chunk(self, merge_code_chunk: MergeCodeChunk) -> Optional[CodeChunk]:
        destination_sheet_index = len(merge_code_chunk.post_state.dfs) - 1
        if destination_sheet_index != self.sheet_index:
            return None

        return MergeCodeChunk(
            merge_code_chunk.prev_state,
            self.post_state,
            merge_code_chunk.how,
            merge_code_chunk.sheet_index_one,
            merge_code_chunk.sheet_index_two,
            merge_code_chunk.merge_key_column_ids,
            merge_code_chunk.selected_column_ids_one,
            merge_code_chunk.selected_column_ids_two,
        )

    def _combine_left_with_import_code_chunk(
            self, 
            import_code_chunk: Union[SimpleImportCodeChunk, ExcelImportCodeChunk, ExcelRangeImportCodeChunk, SnowflakeImportCodeChunk]
        ) -> Optional[CodeChunk]:
        created_sheet_indexes = import_code_chunk.get_created_sheet_indexes()
        if created_sheet_indexes is None or self.sheet_index not in created_sheet_indexes:
            return None

        new_import_chunk = deepcopy(import_code_chunk)
        new_import_chunk.post_state = self.post_state
        return new_import_chunk

    def _combine_left_with_dataframe_duplicate(
        self, 
        dataframe_duplicate_code_chunk: DataframeDuplicateCodeChunk
    ) -> Optional[CodeChunk]:
        if self.sheet_index != len(dataframe_duplicate_code_chunk.post_state.dfs) - 1:
            return None
        
        return DataframeDuplicateCodeChunk(
            dataframe_duplicate_code_chunk.prev_state,
            self.post_state,
            dataframe_duplicate_code_chunk.sheet_index
        )

    def combine_left(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, DataframeRenameCodeChunk):
            return self._combine_left_with_dataframe_rename(other_code_chunk)
        elif isinstance(other_code_chunk, PivotCodeChunk):
            return self._combine_left_with_pivot_code_chunk(other_code_chunk)
        elif isinstance(other_code_chunk, MergeCodeChunk):
            return self._combine_left_with_merge_code_chunk(other_code_chunk)
        elif isinstance(other_code_chunk, SimpleImportCodeChunk) or isinstance(other_code_chunk, ExcelImportCodeChunk) \
            or isinstance(other_code_chunk, ExcelRangeImportCodeChunk) or isinstance(other_code_chunk, SnowflakeImportCodeChunk):
            return self._combine_left_with_import_code_chunk(other_code_chunk)
        elif isinstance(other_code_chunk, DataframeDuplicateCodeChunk):
            return self._combine_left_with_dataframe_duplicate(other_code_chunk)

        return None