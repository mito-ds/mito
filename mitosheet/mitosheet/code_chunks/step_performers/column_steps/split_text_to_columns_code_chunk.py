#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Dict, List, Optional, Union
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.sheet_functions.types.utils import is_datetime_dtype, is_string_dtype, is_timedelta_dtype
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code, column_header_to_transpiled_code, param_dict_to_code
from mitosheet.types import ColumnHeader, ColumnID
from mitosheet.user.utils import get_pandas_version
from mitosheet.utils import is_prev_version

def get_split_param_dict() -> Dict[str, Optional[Union[bool, int]]]:
        # Create a dictionary of the params needed to configure the .split function for
        # split text to columns

        split_param_dict: Dict[str, Optional[Union[bool, int]]] = {
            'n': -1,
            'expand': True, 

        }

        # Regex was added to the split function on pandas 1.4.0. When the delimiter_string is . 
        # and regex is true (the default), it splits on every character. Setting regex=None:
        # If None and pat length is 1, treats pat as a literal string => . won't match on everything
        # If None and pat length is not 1, treats pat as a regular expression => splitting on ',|\t' will split on all commas and tabs
        pandas_version = get_pandas_version()
        if not is_prev_version(pandas_version, '1.4.0'):
            split_param_dict['regex'] = None 

        return split_param_dict


class SplitTextToColumnsCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Split text to columns'
    
    def get_description_comment(self) -> str:
        sheet_index: int = self.get_param('sheet_index')
        column_id: ColumnID = self.get_param('column_id')
        delimiters: List[str] = self.get_param('delimiters')
        column_header = self.post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        delimiters_string = (', ').join(map(lambda x: f'"{x}"', delimiters))
        return f'Split {column_header} on {delimiters_string}'

    def get_code(self) -> List[str]:
        sheet_index: int = self.get_param('sheet_index')
        column_id: ColumnID = self.get_param('column_id')
        delimiters: List[str] = self.get_param('delimiters')
        new_column_headers: List[ColumnHeader] = self.get_execution_data('new_column_headers')

        delimiter_string = repr('|'.join(delimiters))
        
        column_header = self.prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)
        new_transpiled_column_headers = column_header_list_to_transpiled_code(new_column_headers)
        column_idx = self.prev_state.column_ids.get_column_ids(sheet_index).index(column_id)
        df_name = self.post_state.df_names[sheet_index]

        # Split column
        dtype_string = str(self.prev_state.dfs[sheet_index][column_header].dtype)
        if is_string_dtype(dtype_string):
            string_conversion = ''
        elif is_datetime_dtype(dtype_string):
            string_conversion = ".dt.strftime('%Y-%m-%d %X')"
        elif is_timedelta_dtype(dtype_string):
            string_conversion = ".apply(lambda x: str(x))"
        else:
            string_conversion = ".astype('str')"

        split_param_dict = get_split_param_dict()
        split_param_code = param_dict_to_code(split_param_dict, as_single_line=True)
            
        split_column_line = f'{df_name}[{new_transpiled_column_headers}] = {df_name}[{transpiled_column_header}]{string_conversion}.str.split({delimiter_string}, {split_param_code})'

        # Reorder columns 
        reorder_columns_line = f'{df_name} = {df_name}[{df_name}.columns[:{column_idx + 1}].tolist() + {new_transpiled_column_headers} + {df_name}.columns[{column_idx + 1}:-{len(new_column_headers)}].tolist()]'

        return [split_column_line, reorder_columns_line]

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]