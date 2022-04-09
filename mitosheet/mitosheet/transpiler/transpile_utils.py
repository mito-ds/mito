#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Set, Union
from mitosheet.types import ColumnHeader

TAB = '    '
NEWLINE_TAB = f'\n{TAB}'


def column_header_list_to_transpiled_code(column_headers: Union[List[Any], Set[Any]]) -> str:
    """
    A helper function for turning a list of column headers into a 
    valid list of Python code.
    """
    transpiled_column_headers = [
        column_header_to_transpiled_code(column_header)
        for column_header in column_headers
    ]
    joined_transpiled_column_headers = ', '.join(transpiled_column_headers)
    return f'[{joined_transpiled_column_headers}]'


def column_header_to_transpiled_code(column_header: ColumnHeader) -> str:
    """
    Makes sure the column header is correctly transpiled to 
    code in a way that makes sure it's referenced properly.

    Handles multi-index, boolean, string, and number columns 
    correctly.
    """
    # If this is a multi-index header, then we turn each of the pieces of the column
    # header into valid transpiled code, and then we combine them into a tuple
    if isinstance(column_header, tuple):
        column_header_parts = [column_header_to_transpiled_code(column_header_part) for column_header_part in column_header]
        column_header_parts_joined = ', '.join(column_header_parts)
        return f'({column_header_parts_joined})'

    if isinstance(column_header, int) or isinstance(column_header, float) or isinstance(column_header, bool):
        return str(column_header)
    return repr(column_header)

def list_to_string_without_internal_quotes(list: List[Any]) -> str:
    """
    Helper function for formatting a list as a string without 
    leading and trailing '
    """
    string = (', ').join(list)
    return "[" + string +  "]"

def column_header_map_to_string(column_header_map: Dict[ColumnHeader, ColumnHeader]) -> str:
    if len(column_header_map) <= 3:
        # If there are only a few column headers, we put them in a single line
        result = '{' 
        for column_header_key, column_header_value in column_header_map.items():
            result += f'{column_header_to_transpiled_code(column_header_key)}: {column_header_to_transpiled_code(column_header_value)}, '
        result = result[:-2] + "}" # don't take the last comma and space
        return result
    else:
        result = '{\n' 
        for column_header_key, column_header_value in column_header_map.items():
            result += f'{TAB}{column_header_to_transpiled_code(column_header_key)}: {column_header_to_transpiled_code(column_header_value)},\n'
        result = result[:-2] + "\n}" # don't take the last comma and new line
        return result
    
    
