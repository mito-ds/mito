
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID

class BulkFilterCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Bulk Filter'
    
    def get_description_comment(self) -> str:
        sheet_index: int = self.get_param('sheet_index')
        column_id: ColumnID = self.get_param('column_id')
        toggle_type: Any = self.get_param('toggle_type')
        
        return "TODO"

    def get_code(self) -> List[str]:
        sheet_index: int = self.get_param('sheet_index')
        column_id: ColumnID = self.get_param('column_id')
        toggle_type: Any = self.get_param('toggle_type')
        

        # TODO: actually generate the code here!

        return []

    
    def get_edited_sheet_indexes(self) -> List[int]:
        return [] # TODO: return this here!
    