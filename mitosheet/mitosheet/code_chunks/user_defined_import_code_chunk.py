
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.types import UserDefinedFunctionParamType
from mitosheet.step_performers.utils.user_defined_function_utils import get_transpiled_user_defined_function_params


class UserDefinedImportCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, importer: str, user_defined_function_params: Dict[str, Tuple[UserDefinedFunctionParamType, Any, Any]], new_df_names: List[str]):
        super().__init__(prev_state)
        self.importer = importer
        self.user_defined_function_params = user_defined_function_params

        self.df_names = new_df_names

    def get_display_name(self) -> str:
        return 'User Defined Import'
    
    def get_description_comment(self) -> str:
        return f"Imported {', '.join(self.df_names)} using {self.importer}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        # For each new dataframe, we get it's name
        df_name_string = ', '.join(self.df_names)
        code = f"{df_name_string} = {self.importer}({get_transpiled_user_defined_function_params(self.user_defined_function_params)})"
        return [code], []
    
    def get_created_sheet_indexes(self) -> Optional[List[int]]:
        return [i for i in range(len(self.prev_state.dfs), len(self.prev_state.dfs) + len(self.df_names))]