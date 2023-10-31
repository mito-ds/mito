#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List, Tuple, Any, Dict
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import UserDefinedFunctionParamType
from mitosheet.state import State
from mitosheet.step_performers.utils.user_defined_function_utils import get_transpiled_user_defined_function_params

class UserDefinedEditCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, edit_name: str, sheet_index: int, user_defined_function_params: Dict[str, Tuple[UserDefinedFunctionParamType, Any, Any]]):
        super().__init__(prev_state)
        self.edit_name = edit_name
        self.sheet_index = sheet_index
        self.user_defined_function_params = user_defined_function_params

        self.df_name = prev_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'User Defined Edit'
    
    def get_description_comment(self) -> str:
        return f"Edited sheet {self.df_name} with {self.edit_name}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        code = f"{self.df_name} = {self.edit_name}({get_transpiled_user_defined_function_params(self.user_defined_function_params)})"
        return [code], []

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index] 
    