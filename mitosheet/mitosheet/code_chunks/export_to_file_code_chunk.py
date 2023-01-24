
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Dict, List, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import TAB


class ExportToFileCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, export_type: str, file_name: str, sheet_index_to_export_location: Dict[int, str]):
        super().__init__(prev_state, post_state)
        self.export_type = export_type
        self.file_name = file_name
        self.sheet_index_to_export_location = sheet_index_to_export_location

    def get_display_name(self) -> str:
        return 'Export To File'
    
    def get_description_comment(self) -> str:

        return f"Exports {len(self.sheet_index_to_export_location)} to file {self.file_name}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        if self.export_type == 'csv':
            return [
                f'{self.post_state.df_names[sheet_index]}.to_csv("{export_location}", index=False)'
                for sheet_index, export_location in self.sheet_index_to_export_location.items()
            ], []
        elif self.export_type == 'excel':
            # If there is only one sheet being exported, we can avoid creating the pd.ExcelWriter
            if len(self.sheet_index_to_export_location) == 1:
                for sheet_index, export_location in self.sheet_index_to_export_location.items():
                    return [f'{self.post_state.df_names[sheet_index]}.to_excel("{self.file_name}", sheet_name="{export_location}", index={False})'], []

            return [f'with pd.ExcelWriter("{self.file_name}") as writer:'] + [
                f'{TAB}{self.post_state.df_names[sheet_index]}.to_excel(writer, sheet_name="{export_location}", index={False})'
                for sheet_index, export_location in self.sheet_index_to_export_location.items()
            ], ['import pandas as pd']
        else:
            raise ValueError(f'Not a valid file type: {self.export_type}')