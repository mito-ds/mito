#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import deepcopy
from typing import Any, Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State


class EmptyCodeChunk(CodeChunk):
    """
    A code chunk that generates no code, but has a title and a description
    comment, which is necessary for describing some steps in the step list
    even if they don't have generated code (like graphing).

    Notably, as they don't have generated code, we can still optimize out
    these steps in the code optimization process.
    """

    def __init__(self, prev_state: State, post_state: State, display_name: str, description_comment: str):
        super().__init__(prev_state, post_state)
        self.display_name = display_name
        self.description_comment = description_comment

    def get_display_name(self) -> str:
        return self.display_name
    
    def get_description_comment(self) -> str:
        return self.description_comment

    def get_code(self) -> Tuple[List[str], List[str]]:
        return [], []

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        # We just return the other code chunk, while also updating the prev_state. To avoid
        # causing issues by modifying data, we make a copy of this object
        new_other_code_chunk = deepcopy(other_code_chunk)
        new_other_code_chunk.prev_state = self.prev_state
        return new_other_code_chunk