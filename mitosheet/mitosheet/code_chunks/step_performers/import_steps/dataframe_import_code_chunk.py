#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State


class DataframeImportCodeChunk(CodeChunk):
    """
    A code chunk that generates no code, but represents when a dataframe has been
    imported by name. We want this to not be optimized out as it complicates things,
    so we make it it's own code chunk
    """

    def __init__(self, prev_state: State, post_state: State, params: Dict[str, Any], execution_data: Optional[Dict[str, Any]]):
        super().__init__(prev_state, post_state, params, execution_data)
        self.display_name = params['display_name']
        self.description_comment = params['description_comment']

    def get_display_name(self) -> str:
        return self.display_name
    
    def get_description_comment(self) -> str:
        return self.description_comment

    def get_code(self) -> List[str]:
        return []