#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import os
from typing import Any, Dict, List, Optional
import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code

# We use 'default' instead of None to ensure that we log the encoding even when we don't need to set one.
DEFAULT_ENCODING = 'default'
DEFAULT_DELIMETER = ','
DEFAULT_ERROR_BAD_LINES = True

def get_read_csv_params(delimeter: str, encoding: str, error_bad_lines: bool) -> Dict[str, Any]:
    from mitosheet.saved_analyses.schema_utils import is_prev_version
    params: Dict[str, Any] = {}

    if encoding != DEFAULT_ENCODING:
        params['encoding'] = encoding
    if delimeter != DEFAULT_DELIMETER:
        params['sep'] = delimeter
    if error_bad_lines != DEFAULT_ERROR_BAD_LINES:
        # See here: https://datascientyst.com/drop-bad-lines-with-read_csv-pandas/
        if is_prev_version(pd.__version__, '1.3.0'):
            params['error_bad_lines'] = error_bad_lines
        else:
            params['on_bad_lines'] = 'skip'
    
    return params


def generate_read_csv_code(file_name: str, df_name: str, delimeter: str, encoding: str, error_bad_lines: bool) -> str:
    """
    Helper function for generating minimal read_csv code 
    depending on the delimeter and the encoding of a file
    """

    params = get_read_csv_params(delimeter, encoding, error_bad_lines)
    params_string = ', '.join(f'{key}={column_header_to_transpiled_code(value)}' for key, value in params.items())

    return f'{df_name} = pd.read_csv(r\'{file_name}\'{", " if len(params_string) > 0 else ""}{params_string})'


class SimpleImportCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Imported'
    
    def get_description_comment(self) -> str:
        file_names = self.get_param('file_names')
        base_names = [os.path.basename(path) for path in file_names]
        return f'Imported {", ".join(base_names)}'

    def get_code(self) -> List[str]:
        file_names = self.get_param('file_names')
        file_delimeters = self.get_execution_data('file_delimeters')
        file_encodings = self.get_execution_data('file_encodings')
        file_error_bad_lines = self.get_execution_data('file_error_bad_lines')

        code = ['import pandas as pd']

        index = 0
        for file_name, df_name in zip(file_names, self.post_state.df_names[len(self.post_state.df_names) - len(file_names):]):

            delimeter = file_delimeters[index]
            encoding = file_encodings[index]
            error_bad_lines = file_error_bad_lines[index]


            code.append(
                generate_read_csv_code(file_name, df_name, delimeter, encoding, error_bad_lines)
            )
            
            index += 1

        return code

    def get_created_sheet_indexes(self) -> List[int]:
        sheet_names = self.get_param('file_names')
        return [i for i in range(len(self.post_state.dfs) - len(sheet_names), len(self.post_state.dfs))]

    def _combine_right_simple_import(self, other_code_chunk: "SimpleImportCodeChunk") -> Optional["CodeChunk"]:
        # We can easily combine simple imports, so we do so
        file_names = self.get_param('file_names') + other_code_chunk.get_param('file_names')
        new_file_delimeters = self.get_execution_data('file_delimeters') + other_code_chunk.get_execution_data('file_delimeters')
        new_file_encodings = self.get_execution_data('file_encodings') + other_code_chunk.get_execution_data('file_encodings')
        new_error_bad_lines = self.get_execution_data('file_error_bad_lines') + other_code_chunk.get_execution_data('file_error_bad_lines')

        return SimpleImportCodeChunk(
            self.prev_state,
            other_code_chunk.post_state,
            {'file_names': file_names},
            {
                'file_delimeters': new_file_delimeters,
                'file_encodings': new_file_encodings,
                'file_error_bad_lines': new_error_bad_lines
            }
        )

    def combine_right(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, SimpleImportCodeChunk):
            return self._combine_right_simple_import(other_code_chunk)

        return None
