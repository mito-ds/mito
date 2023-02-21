
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import ast
from typing import List, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID
from mitosheet.state import State

class AITransformationCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, user_input: str, edited_completion: str, last_line_is_dataframe: bool):
        super().__init__(prev_state, post_state)
        self.user_input = user_input
        self.edited_completion = edited_completion
        self.last_line_is_dataframe = last_line_is_dataframe

    def get_display_name(self) -> str:
        return 'AI Transformation'
    
    def get_description_comment(self) -> str:
        return self.user_input

    def get_code(self) -> Tuple[List[str], List[str]]:
        if self.last_line_is_dataframe:
            ast_before = ast.parse(self.edited_completion)
            last_expression = ast_before.body[-1]
            last_expression_string = ast.unparse([last_expression])
            code = self.edited_completion.replace(last_expression_string, f'{self.post_state.df_names[-1]} = {last_expression_string}')
        else:
            code = self.edited_completion

        return [
            code
        ], []

    def get_edited_sheet_indexes(self) -> List[int]:
        # TODO: we can save this perhaps?
        return [] # TODO: return this here!
    