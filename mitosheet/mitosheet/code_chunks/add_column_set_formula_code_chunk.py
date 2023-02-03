#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from typing import Any, Dict, List, Optional, Tuple, Union

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.no_op_code_chunk import NoOpCodeChunk
from mitosheet.code_chunks.step_performers.column_steps.delete_column_code_chunk import DeleteColumnsCodeChunk
from mitosheet.code_chunks.step_performers.column_steps.rename_columns_code_chunk import RenameColumnsCodeChunk
from mitosheet.parser import parse_formula
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code
from mitosheet.types import ColumnHeader, ColumnID, FormulaAppliedToType


class AddColumnSetFormulaCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, column_id: ColumnID, formula_label: Union[str, bool, int, float], index_labels_formula_is_applied_to: FormulaAppliedToType, column_header: ColumnHeader, column_header_index: int, new_formula: str):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.column_id = column_id
        self.column_header = column_header
        self.formula_label = formula_label
        self.index_labels_formula_is_applied_to = index_labels_formula_is_applied_to
        self.column_header_index = column_header_index
        self.new_formula = new_formula

        self.df_name = self.post_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'Added column'
    
    def get_description_comment(self) -> str:
        return f'Added column {column_header_to_transpiled_code(self.column_header)}'

    def get_code(self) -> Tuple[List[str], List[str]]:
        python_code, _, _, _ = parse_formula(
            self.new_formula, 
            self.column_header,
            self.formula_label,
            self.index_labels_formula_is_applied_to,
            self.post_state.dfs[self.sheet_index],
            df_name=self.post_state.df_names[self.sheet_index],
            include_df_set=False
        )

        transpiled_column_header = column_header_to_transpiled_code(self.column_header)
        column_header_index = self.column_header_index
        return [
            f'{self.df_name}.insert({column_header_index}, {transpiled_column_header}, {python_code})'
        ], []

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]

    def _combine_right_with_delete_columns_code_chunk(self, other_code_chunk: DeleteColumnsCodeChunk) -> Optional["CodeChunk"]:
        # Make sure the sheet index matches up first
        if not self.params_match(other_code_chunk, ['sheet_index']):
            return None
        
        # Check to see if the column ids overlap
        added_column_id = self.post_state.column_ids.get_column_id_by_header(self.sheet_index, self.column_header)
        deleted_column_ids = other_code_chunk.column_ids

        if added_column_id in deleted_column_ids and len(deleted_column_ids) == 1:
            return NoOpCodeChunk(
                self.prev_state, 
                other_code_chunk.post_state, 
            )
        elif added_column_id in deleted_column_ids:
            new_deleted_column_ids = copy(deleted_column_ids)
            new_deleted_column_ids.remove(added_column_id)

            return DeleteColumnsCodeChunk(
                self.prev_state,
                other_code_chunk.post_state,
                self.sheet_index,
                new_deleted_column_ids
            )
        
        return None

    def _combine_right_with_rename_columns_code_chunk(self, other_code_chunk: RenameColumnsCodeChunk) -> Optional["CodeChunk"]:
        if not self.params_match(other_code_chunk, ['sheet_index']):
            return None

        added_column_id = self.column_id
        column_ids_to_new_column_headers = other_code_chunk.column_ids_to_new_column_headers

        if added_column_id in column_ids_to_new_column_headers and len(column_ids_to_new_column_headers) == 1:
            return AddColumnSetFormulaCodeChunk(
                self.prev_state,
                other_code_chunk.post_state,
                self.sheet_index,
                self.column_id,
                self.formula_label,
                self.index_labels_formula_is_applied_to,
                column_ids_to_new_column_headers[added_column_id],
                self.column_header_index,
                self.new_formula
            )

        return None
        
    def combine_right(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, DeleteColumnsCodeChunk):
            return self._combine_right_with_delete_columns_code_chunk(other_code_chunk)
        elif isinstance(other_code_chunk, RenameColumnsCodeChunk):
            return self._combine_right_with_rename_columns_code_chunk(other_code_chunk)

        return None
