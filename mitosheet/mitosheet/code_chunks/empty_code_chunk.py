#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List, Optional
from mitosheet.code_chunks.code_chunk import CodeChunk


class EmptyCodeChunk(CodeChunk):
    """
    A code chunk that generates no code, but has a title. 

    NOTE: This is different than a NoOpCodeChunk, which we
    always want to be optimized out, as this has data we
    want to display to the user. Graphing steps are an example
    of this!
    """

    def get_display_name(self) -> str:
        return self.get_param('display_name')
    
    def get_description_comment(self) -> str:
        return self.get_param('description_comment')

    def get_code(self) -> List[str]:
        return []