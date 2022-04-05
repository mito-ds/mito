#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk


class EmptyCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'No operation'
    
    def get_description_comment(self) -> str:
        return 'Did nothing'

    def get_code(self) -> List[str]:
        return []