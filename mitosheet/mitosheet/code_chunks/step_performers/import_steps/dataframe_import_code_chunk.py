#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List, Optional
from mitosheet.code_chunks.code_chunk import CodeChunk


class DataframeImportCodeChunk(CodeChunk):
    """
    A code chunk that generates no code, but represents when a dataframe has been
    imported by name. We want this to not be optimized out as it complicates things,
    so we make it it's own code chunk
    """

    def get_display_name(self) -> str:
        return self.get_param('display_name')
    
    def get_description_comment(self) -> str:
        return self.get_param('description_comment')

    def get_code(self) -> List[str]:
        return []