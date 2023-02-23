
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import ast
from typing import List, Tuple
from mitosheet.ai.recon import get_code_string_from_last_expression
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
            # If the code has a last line expression that creates a dataframe, then we create a new dataframe
            # in the state for that. Thus, we must change the code to set the name of that dataframe so the
            # executed code matches the state code
            # TODO: in the future, we can do this with import fix up before we even execute the code?
            ast_before = ast.parse(self.edited_completion)
            last_expression = ast_before.body[-1]
            last_expression_string = get_code_string_from_last_expression(self.edited_completion, last_expression)
            code = self.edited_completion.replace(last_expression_string, f'{self.post_state.df_names[-1]} = {last_expression_string}')
        else:
            code = self.edited_completion

        return [
            code
        ], []

    def get_edited_sheet_indexes(self) -> List[int]:
        # TODO: we can save this perhaps?
        return [] # TODO: return this here!
    