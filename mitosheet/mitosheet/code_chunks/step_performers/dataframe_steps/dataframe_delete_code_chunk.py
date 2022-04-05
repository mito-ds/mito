#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk


class DataframeDeleteCodeChunk(CodeChunk):

    def transpile(self) -> List[str]:
        old_dataframe_name = self.get_param('old_dataframe_name')

        return [f'del {old_dataframe_name}']