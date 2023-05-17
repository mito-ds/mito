
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List, Tuple
from mitosheet.ai.ai_utils import get_import_lines_to_add
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State

class AITransformationCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, user_input: str, final_code: str):
        super().__init__(prev_state, post_state)
        self.user_input = user_input
        self.final_code = final_code

    def get_display_name(self) -> str:
        return 'AI Transformation'
    
    def get_description_comment(self) -> str:
        return self.user_input

    def get_code(self) -> Tuple[List[str], List[str]]:
        import_lines = get_import_lines_to_add(self.final_code)
        return [
            self.final_code.strip()
        ], import_lines

    def get_edited_sheet_indexes(self) -> List[int]:
        # TODO: we can save this perhaps?
        return [] # TODO: return this here!
    