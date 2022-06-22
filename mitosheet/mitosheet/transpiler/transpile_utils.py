#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Set, Union
import numpy as np

import pandas as pd
from mitosheet.types import ColumnHeader

TAB = '    '
NEWLINE_TAB = f'\n{TAB}'


def get_transpiled_code_for_object_list(objs: Union[List[Any], Set[Any]]) -> str:
    """
    A helper function for turning a list of column headers into a 
    valid list of Python code.
    """
    transpiled_objects = [
        get_transpiled_code_for_object(obj)
        for obj in objs
    ]
    joined_transpiled_objects = ', '.join(transpiled_objects)
    return f'[{joined_transpiled_objects}]'


def get_transpiled_code_for_object(obj: Any) -> str:
    """
    Makes sure the column header is correctly transpiled to 
    code in a way that makes sure it's referenced properly.

    Handles multi-index, boolean, string, and number columns 
    correctly.
    """
    # If this is a multi-index header, then we turn each of the pieces of the column
    # header into valid transpiled code, and then we combine them into a tuple
    if isinstance(obj, tuple):
        column_header_parts = [get_transpiled_code_for_object(column_header_part) for column_header_part in obj]
        column_header_parts_joined = ', '.join(column_header_parts)
        return f'({column_header_parts_joined})'

    if obj == 'NaN' or (isinstance(obj, float) and np.isnan(obj)):
        return 'np.NaN'

    if isinstance(obj, int) or isinstance(obj, float) or isinstance(obj, bool):
        return str(obj)
    elif isinstance(obj, pd.Timestamp):
        return f'pd.to_datetime(\'{obj.strftime("%Y-%m-%d %X")}\')'
    elif isinstance(obj, pd.Timedelta):
        return f'pd.to_timedelta(\'{str(obj)}\')'

    return repr(obj)

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
            result += f'{get_transpiled_code_for_object(column_header_key)}: {get_transpiled_code_for_object(column_header_value)}, '
        result = result[:-2] + "}" # don't take the last comma and space
        return result
    else:
        result = '{\n' 
        for column_header_key, column_header_value in column_header_map.items():
            result += f'{TAB}{get_transpiled_code_for_object(column_header_key)}: {get_transpiled_code_for_object(column_header_value)},\n'
        result = result[:-2] + "\n}" # don't take the last comma and new line
        return result
    
    
