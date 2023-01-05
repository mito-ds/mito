#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Set, Tuple, Union

import pandas as pd
import numpy as np
from mitosheet.types import ColumnHeader
from mitosheet.utils import is_prev_version

# TAB is used in place of \t in generated code because
# Jupyter turns \t into a grey arrow, but converts four spaces into a tab.
TAB = '    '
NEWLINE_TAB = f'\n{TAB}'
NEWLINE = '\n'


def column_header_list_to_transpiled_code(column_headers: Union[List[ColumnHeader], Set[ColumnHeader], List[Tuple[str, Optional[str]]]]) -> str:
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

    # We must handle np.nan first because isinstance(np.nan, float) evaluates to True
    if not is_prev_version(pd.__version__, '1.0.0') and column_header is np.nan:
        return 'pd.np.nan'
    elif isinstance(column_header, int) or isinstance(column_header, float) or isinstance(column_header, bool):
        return str(column_header)
    elif isinstance(column_header, pd.Timestamp):
        return f'pd.to_datetime(\'{column_header.strftime("%Y-%m-%d %X")}\')'
    elif isinstance(column_header, pd.Timedelta):
        return f'pd.to_timedelta(\'{str(column_header)}\')'
    elif column_header is pd.NaT:
        return 'pd.NaT'
    elif not is_prev_version(pd.__version__, '1.0.0') and column_header is pd.NA:
        return 'pd.NA'
        
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


def param_dict_to_code(param_dict: Dict[str, Any], level: int=0, as_single_line: bool=False) -> str:
    """
    Takes a potentially nested params dictonary and turns it into a
    code string that we can use in the graph generated code.

    level should be 0 if we are at the highest level dict, and otherwise
    should increment by 1 anytime we enter a new subdictonary.
    """

    # Make sure we handle as a single line properly
    if as_single_line:
        TAB_CONSTANT = ''
        NEWLINE_CONSTANT = ''
    else:
        TAB_CONSTANT = TAB
        NEWLINE_CONSTANT = '\n'

    if level == 0:
        code = f"{NEWLINE_CONSTANT}"
    else:
        code = f"dict({NEWLINE_CONSTANT}"

    value_num = 0
    for key, value in param_dict.items():
        if isinstance(value, dict):
            # Recurse on this nested param dictonary
            code_chunk = f"{key} = {param_dict_to_code(value, level=level + 1)}"
        else:
            # We use this slighly misnamed function to make sure values get transpiled right
            code_chunk = f"{key}={column_header_to_transpiled_code(value)}"
        
        # If we're not on the first value in this dict, we need to add a 
        # command new line after the last value
        if value_num != 0:
            code += f", {NEWLINE_CONSTANT}"

        value_num += 1

        # Add spacing before the param
        code += f"{TAB_CONSTANT * (level + 1)}"

        code += f"{code_chunk}"

    if level == 0:
        code += f"{NEWLINE_CONSTANT}"
    else:
        # Make sure to close the dict
        code += f"{NEWLINE_CONSTANT}{TAB_CONSTANT * (level)})"
    
    return code