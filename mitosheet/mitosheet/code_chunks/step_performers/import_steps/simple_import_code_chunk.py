#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import os
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code
from mitosheet.utils import is_prev_version

# Note: These defaults must be the same as the pandas.read_csv defaults
DEFAULT_ENCODING = 'utf-8'
DEFAULT_DELIMETER = ','
DEFAULT_DECIMAL = '.'
DEFAULT_SKIPROWS = 0
DEFAULT_ERROR_BAD_LINES = True

def get_read_csv_params(delimeter: str, encoding: str, decimal: Optional[str], skiprows: Optional[int], error_bad_lines: Optional[bool]) -> Dict[str, Any]:
    params: Dict[str, Any] = {}

    if encoding != DEFAULT_ENCODING:
        params['encoding'] = encoding
    if delimeter != DEFAULT_DELIMETER:
        params['sep'] = delimeter
    if decimal is not None and decimal != DEFAULT_DECIMAL: 
        params['decimal'] = decimal
    if skiprows is not None and skiprows != DEFAULT_SKIPROWS:
        params['skiprows'] = skiprows
    if error_bad_lines is not None and error_bad_lines != DEFAULT_ERROR_BAD_LINES:
        # See here: https://datascientyst.com/drop-bad-lines-with-read_csv-pandas/
        if is_prev_version(pd.__version__, '1.3.0'):
            params['error_bad_lines'] = error_bad_lines
        else:
            params['on_bad_lines'] = 'skip'
    
    return params


def generate_read_csv_code(file_name: str, df_name: str, delimeter: str, encoding: str, decimal: Optional[str], skiprows: Optional[int], error_bad_lines: Optional[bool]) -> str:
    """
    Helper function for generating minimal read_csv code 
    depending on the delimeter and the encoding of a file
    """

    params = get_read_csv_params(delimeter, encoding, decimal=decimal, skiprows=skiprows, error_bad_lines=error_bad_lines)
    params_string = ', '.join(f'{key}={column_header_to_transpiled_code(value)}' for key, value in params.items())

    return f'{df_name} = pd.read_csv(r\'{file_name}\'{", " if len(params_string) > 0 else ""}{params_string})'


class SimpleImportCodeChunk(CodeChunk):

    
    def __init__(self, prev_state: State, post_state: State, file_names: List[str], file_delimeters: List[str], file_encodings: List[str], file_decimals: List[str], file_skiprows: List[int], file_error_bad_lines: List[bool]):
        super().__init__(prev_state, post_state)
        self.file_names = file_names
        self.file_delimeters = file_delimeters
        self.file_encodings = file_encodings
        self.file_decimals = file_decimals
        self.file_skiprows = file_skiprows
        self.file_error_bad_lines = file_error_bad_lines

    def get_display_name(self) -> str:
        return 'Imported'
    
    def get_description_comment(self) -> str:
        base_names = [os.path.basename(path) for path in self.file_names]
        return f'Imported {", ".join(base_names)}'

    def get_code(self) -> Tuple[List[str], List[str]]:

        code = []

        index = 0
        for file_name, df_name in zip(self.file_names, self.post_state.df_names[len(self.post_state.df_names) - len(self.file_names):]):

            delimeter = self.file_delimeters[index]
            encoding = self.file_encodings[index]
            decimal = self.file_decimals[index]
            skiprows = self.file_skiprows[index]
            error_bad_lines = self.file_error_bad_lines[index]

            code.append(
                generate_read_csv_code(file_name, df_name, delimeter, encoding, decimal, skiprows, error_bad_lines)
            )
            
            index += 1

        return code, ['import pandas as pd']

    def get_created_sheet_indexes(self) -> List[int]:
        return [i for i in range(len(self.post_state.dfs) - len(self.file_names), len(self.post_state.dfs))]

    def _combine_right_simple_import(self, other_code_chunk: "SimpleImportCodeChunk") -> Optional["CodeChunk"]:
        # We can easily combine simple imports, so we do so
        file_names = self.file_names + other_code_chunk.file_names
        new_file_delimeters = self.file_delimeters + other_code_chunk.file_delimeters
        new_file_encodings = self.file_encodings + other_code_chunk.file_encodings
        new_file_decimals = self.file_decimals + other_code_chunk.file_decimals
        new_file_skiprows = self.file_skiprows + other_code_chunk.file_skiprows
        new_error_bad_lines = self.file_error_bad_lines + other_code_chunk.file_error_bad_lines

        return SimpleImportCodeChunk(
            self.prev_state,
            other_code_chunk.post_state,
            file_names,
            new_file_delimeters,
            new_file_encodings,
            new_file_decimals,
            new_file_skiprows,
            new_error_bad_lines
        )

    def combine_right(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, SimpleImportCodeChunk):
            return self._combine_right_simple_import(other_code_chunk)

        return None
