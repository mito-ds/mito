#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk


class EmptyCodeChunk(CodeChunk):

    def transpile(self) -> List[str]:
        return []