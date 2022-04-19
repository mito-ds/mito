#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import List, Optional

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.no_op_code_chunk import NoOpCodeChunk
from mitosheet.code_chunks.step_performers.dataframe_steps.dataframe_rename_code_chunk import DataframeRenameCodeChunk

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
        # that are greater than those deleted first, so that they have the correct
        # index in the newly combined step
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

        # Dataframe renames are compicated to combine with dataframe deletes so we simple
        # do not combine them
        if isinstance(other_code_chunk, DataframeRenameCodeChunk):
            return None

        deleted_sheet_indexes = self.get_param('sheet_indexes')
        created_sheet_indexes = other_code_chunk.get_created_sheet_indexes()

        if created_sheet_indexes is not None and set(deleted_sheet_indexes) == set(created_sheet_indexes):
            # If all we did was create the dfs we deleted, we can just return a no op
            return NoOpCodeChunk(other_code_chunk.prev_state, self.post_state, {}, {})
            
        elif created_sheet_indexes is not None and set(deleted_sheet_indexes).issuperset(set(created_sheet_indexes)):
            # If the set we are deleting is a superset of the the dataframes that we created
            # in this other step, then we must create a new code chunk that doesn't have these
            # deletes for the created sheets (as we're just not including these created steps)
            new_deleted_sheet_indexes = copy(self.get_param('sheet_indexes'))
            new_old_dataframe_names = copy(self.get_param('old_dataframe_names'))

            for created_sheet_index in created_sheet_indexes:
                # Find the index of the sheet index we need to delete, and remove that as well
                # as the old dataframe name, which is at the same index
                index_in_params_array = new_deleted_sheet_indexes.index(created_sheet_index)
                new_deleted_sheet_indexes.pop(index_in_params_array)
                new_old_dataframe_names.pop(index_in_params_array)
            
            return DataframeDeleteCodeChunk(
                other_code_chunk.prev_state,
                self.post_state,
                {
                    'sheet_indexes': new_deleted_sheet_indexes,
                    'old_dataframe_names': new_old_dataframe_names,
                },
                {}
            )

        sheet_indexes_edited = other_code_chunk.get_edited_sheet_indexes()
        if sheet_indexes_edited is not None and set(deleted_sheet_indexes).issuperset(set(sheet_indexes_edited)):
            return self

        return None


