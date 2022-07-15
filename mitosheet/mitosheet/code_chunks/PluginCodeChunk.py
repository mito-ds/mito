#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List, Optional
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.plugins.plugin import Plugin


class PluginCodeChunk(CodeChunk):
    """A code chunk that generates code for a plugin"""

    def get_display_name(self) -> str:
        return "Custom transformation"
    
    def get_description_comment(self) -> str:
        return "Custom transformation"

    def get_code(self) -> List[str]:
        plugin: Plugin = self.get_execution_data('plugin')
        return plugin.get_code()

    def combine_right(self, other_code_chunk: CodeChunk) -> Optional[CodeChunk]:
        return None