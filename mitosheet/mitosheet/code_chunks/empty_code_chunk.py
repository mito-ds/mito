#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List, Optional
from mitosheet.code_chunks.code_chunk import CodeChunk


class EmptyCodeChunk(CodeChunk):
    """
    A code chunk that generates no code, but has a title and a description
    comment, which is necessary for describing some steps in the step list
    even if they don't have generated code (like graphing).

    Notably, as they don't have generated code, we can still optimize out
    these steps in the code optimization process.
    """

    def get_display_name(self) -> str:
        return self.get_param('display_name')
    
    def get_description_comment(self) -> str:
        return self.get_param('description_comment')

    def get_code(self) -> List[str]:
        return []

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        # We just return the other code chunk, while also updating the prev_state. To avoid
        # causing issues by modifying data, we make a copy of this object
        return type(other_code_chunk)(
            self.prev_state,
            other_code_chunk.post_state,
            other_code_chunk.params,
            other_code_chunk.execution_data
        )