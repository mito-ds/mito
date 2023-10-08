#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.


from typing import Any, Dict, List, Optional, Tuple, Union

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.code_chunk_utils import \
    get_right_combine_with_column_delete_code_chunk
from mitosheet.code_chunks.step_performers.column_steps.delete_column_code_chunk import \
    DeleteColumnsCodeChunk
from mitosheet.parser import parse_formula
from mitosheet.state import State
from mitosheet.types import (FORMULA_ENTIRE_COLUMN_TYPE, ColumnID,
                             FormulaAppliedToType)
from mitosheet.transpiler.transpile_utils import get_column_header_list_as_transpiled_code


class SetColumnFormulaCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, sheet_index: int, column_id: ColumnID, formula_label: Union[str, bool, int, float], index_labels_formula_is_applied_to: FormulaAppliedToType, new_formula: str, public_interface_version: int):
        super().__init__(prev_state)
        self.sheet_index = sheet_index
        self.column_id = column_id
        self.formula_label = formula_label
        self.index_labels_formula_is_applied_to = index_labels_formula_is_applied_to
        self.new_formula = new_formula
        self.public_interface_version = public_interface_version

        self.df_name = self.prev_state.df_names[self.sheet_index]
        self.column_header = self.prev_state.column_ids.get_column_header_by_id(self.sheet_index, self.column_id)

    def get_display_name(self) -> str:
        return 'Updated column formula'
    
    def get_description_comment(self) -> str:
        if self.index_labels_formula_is_applied_to['type'] == FORMULA_ENTIRE_COLUMN_TYPE:
            return f'Set formula of {self.column_header}'
        else:
            return f'Set formula of {self.column_header} at rows { {get_column_header_list_as_transpiled_code(self.index_labels_formula_is_applied_to["index_labels"])}}' # type: ignore

    def get_code(self) -> Tuple[List[str], List[str]]:
        python_code, _, _, _ = parse_formula(
            self.new_formula, 
            self.column_header,
            self.formula_label,
            self.index_labels_formula_is_applied_to,
            self.prev_state.dfs,
            self.prev_state.df_names,
            self.sheet_index,
        )

        return [
            python_code
        ], []

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]

    def _combine_right_with_delete_column_code_chunk(self, other_code_chunk: DeleteColumnsCodeChunk) -> Optional[CodeChunk]:
        return get_right_combine_with_column_delete_code_chunk(
            self,
            other_code_chunk,
            'sheet_index',
            'column_id',
        )

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        if isinstance(other_code_chunk, DeleteColumnsCodeChunk):
            return self._combine_right_with_delete_column_code_chunk(other_code_chunk)

        return None
