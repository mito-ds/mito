
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID, DataframeFormat

class SetDataframeFormatCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Set Dataframe Format'
    
    def get_description_comment(self) -> str:
        sheet_index: int = self.get_param('sheet_index')
        df_format: DataframeFormat = self.get_param('df_format')
        
        return "TODO"

    def get_code(self) -> List[str]:
        sheet_index: int = self.get_param('sheet_index')
        df_format: DataframeFormat = self.get_param('df_format')
        
        return [
            '# TODO: implement this code chunk'
        ]

    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [] # TODO: return this here!
    