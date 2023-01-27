#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from typing import Any, Dict, List, Optional, Tuple

from mitosheet.code_chunks.add_column_set_formula_code_chunk import \
    AddColumnSetFormulaCodeChunk
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.no_op_code_chunk import NoOpCodeChunk
from mitosheet.code_chunks.step_performers.column_steps.delete_column_code_chunk import \
    DeleteColumnsCodeChunk
from mitosheet.code_chunks.step_performers.column_steps.rename_columns_code_chunk import \
    RenameColumnsCodeChunk
from mitosheet.code_chunks.step_performers.column_steps.set_column_formula_code_chunk import \
    SetColumnFormulaCodeChunk
from mitosheet.state import State
from mitosheet.types import FORMULA_ENTIRE_COLUMN_TYPE
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code


class AddColumnCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, column_header: str, column_header_index: int):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.column_header = column_header
        self.column_header_index = column_header_index

        self.column_id = self.post_state.column_ids.get_column_id_by_header(self.sheet_index, self.column_header)
        self.df_name: str = self.post_state.df_names[self.sheet_index]


    def get_display_name(self) -> str:
        return 'Added column'
    
    def get_description_comment(self) -> str:
        return f'Added column {self.column_header}'

    def get_code(self) -> Tuple[List[str], List[str]]:
        transpiled_column_header = column_header_to_transpiled_code(self.column_header)
        return [
            f'{self.df_name}.insert({self.column_header_index}, {transpiled_column_header}, 0)'
        ], []

    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]

    def _combine_right_with_delete_column_code_chunk(self, other_code_chunk: DeleteColumnsCodeChunk) -> Optional[CodeChunk]:
        # Make sure the sheet index matches up first
        if not self.params_match(other_code_chunk, ['sheet_index']):
            return None
        
        # Check to see if the column ids overlap
        sheet_index = self.sheet_index
        added_column_header = self.column_header
        added_column_id = self.post_state.column_ids.get_column_id_by_header(sheet_index, added_column_header)
        deleted_column_ids = other_code_chunk.column_ids

        if added_column_id in deleted_column_ids and len(deleted_column_ids) == 1:
            return NoOpCodeChunk(
                self.prev_state, 
                other_code_chunk.post_state
            )
        elif added_column_id in deleted_column_ids:
            new_deleted_column_ids = copy(deleted_column_ids)
            new_deleted_column_ids.remove(added_column_id)

            return DeleteColumnsCodeChunk(
                self.prev_state,
                other_code_chunk.post_state,
                sheet_index,
                new_deleted_column_ids
            )
        
        return None
    
    def _combine_right_with_rename_columns_code_chunk(self, other_code_chunk: RenameColumnsCodeChunk) -> Optional[CodeChunk]:
        # Make sure the sheet index matches up first
        if not self.params_match(other_code_chunk, ['sheet_index']):
            return None
        
        # Check to see if the column ids overlap
        added_column_id = self.post_state.column_ids.get_column_id_by_header(self.sheet_index, self.column_header)
        column_ids_to_new_column_headers = other_code_chunk.column_ids_to_new_column_headers

        if added_column_id in column_ids_to_new_column_headers and len(column_ids_to_new_column_headers) == 1:
            # Handle the case where the is just one column added here
            new_column_header = column_ids_to_new_column_headers[added_column_id]
            return AddColumnCodeChunk(
                self.prev_state,
                other_code_chunk.post_state,
                self.sheet_index,
                new_column_header,
                self.column_header_index 
            )
        else:
            # We'd prefer to keep all the renames together in this case, although
            # this will not happen often
            return None
    
    def _combine_right_with_set_column_formula_code_chunk(self, other_code_chunk: SetColumnFormulaCodeChunk) -> Optional[CodeChunk]:
        if not self.params_match(other_code_chunk, ['sheet_index']):
            return None

        # If this does not set the entire column, we can't combine -- the insert doesn't work
        if other_code_chunk.index_labels_formula_is_applied_to['type'] != FORMULA_ENTIRE_COLUMN_TYPE:
            return None

        sheet_index = self.sheet_index
        added_column_header = self.column_header
        added_column_id = self.post_state.column_ids.get_column_id_by_header(sheet_index, added_column_header)
        
        if added_column_id != other_code_chunk.column_id:
            return None

        return AddColumnSetFormulaCodeChunk(
            self.prev_state,
            other_code_chunk.post_state,
            self.sheet_index,
            added_column_id,
            other_code_chunk.formula_label,
            other_code_chunk.index_labels_formula_is_applied_to,
            self.column_header,
            self.column_header_index,
            other_code_chunk.new_formula
        )

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        if isinstance(other_code_chunk, DeleteColumnsCodeChunk):
            return self._combine_right_with_delete_column_code_chunk(other_code_chunk)
        elif isinstance(other_code_chunk, RenameColumnsCodeChunk):
            return self._combine_right_with_rename_columns_code_chunk(other_code_chunk)
        elif isinstance(other_code_chunk, SetColumnFormulaCodeChunk):
            return self._combine_right_with_set_column_formula_code_chunk(other_code_chunk)

        return None