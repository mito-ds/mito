#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID
from mitosheet.state import State

from mitosheet.errors import make_invalid_column_type_change_error
from mitosheet.is_type_utils import ( is_bool_dtype,
                                                    is_datetime_dtype,
                                                    is_float_dtype,
                                                    is_int_dtype,
                                                    is_string_dtype,
                                                    is_timedelta_dtype)
from mitosheet.transpiler.transpile_utils import get_column_header_as_transpiled_code, get_param_dict_as_code


def get_conversion_code(state: State, sheet_index: int, column_id: ColumnID, old_dtype: str, new_dtype: str, to_datetime_params_map: Optional[Dict[ColumnID, Dict[str, Any]]], public_interface_version: int) -> Optional[str]:
    
    column_header = state.column_ids.get_column_header_by_id(sheet_index, column_id)
    transpiled_column_header = get_column_header_as_transpiled_code(column_header)
    df_name = state.df_names[sheet_index]

    if is_bool_dtype(old_dtype):
        if is_bool_dtype(new_dtype):
            return None
        elif is_int_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].astype(\'int\')'
        elif is_float_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].astype(\'float\')'
        elif is_string_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].astype(\'str\')'
        elif is_datetime_dtype(new_dtype):
            raise make_invalid_column_type_change_error(
                column_header,
                old_dtype,
                new_dtype
            )
        elif is_timedelta_dtype(new_dtype):
            raise make_invalid_column_type_change_error(
                column_header,
                old_dtype,
                new_dtype
            )
    elif is_int_dtype(old_dtype):
        if is_bool_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].fillna(False).astype(\'bool\')'
        elif is_int_dtype(new_dtype):
            return None
        elif is_float_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].astype(\'float\')'
        elif is_string_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].astype(\'str\')'
        elif is_datetime_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = pd.to_datetime({df_name}[{transpiled_column_header}], unit=\'s\', errors=\'coerce\')'
        elif is_timedelta_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = pd.to_timedelta({df_name}[{transpiled_column_header}], unit=\'s\', errors=\'coerce\')'
    elif is_float_dtype(old_dtype):
        if is_bool_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].fillna(False).astype(\'bool\')'
        elif is_int_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].fillna(0).astype(\'int\')'
        elif is_float_dtype(new_dtype):
            return None
        elif is_string_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].astype(\'str\')'
        elif is_datetime_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = pd.to_datetime({df_name}[{transpiled_column_header}], unit=\'s\', errors=\'coerce\')'
        elif is_timedelta_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = pd.to_timedelta({df_name}[{transpiled_column_header}], unit=\'s\', errors=\'coerce\')'
    elif is_string_dtype(old_dtype):
        if is_bool_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = to_boolean_series({df_name}[{transpiled_column_header}])'
        elif is_int_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = to_int_series({df_name}[{transpiled_column_header}])'
        elif is_float_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = to_float_series({df_name}[{transpiled_column_header}])'
        elif is_string_dtype(new_dtype):
            return None
        elif is_datetime_dtype(new_dtype):
            if to_datetime_params_map is not None:
                to_datetime_params = to_datetime_params_map[column_id]
            else:
                to_datetime_params = {}

            datetime_params_string = get_param_dict_as_code(to_datetime_params, as_single_line=True)

            if datetime_params_string:
                return f'{df_name}[{transpiled_column_header}] = pd.to_datetime({df_name}[{transpiled_column_header}], {datetime_params_string}, errors=\'coerce\')'
            else:
                return f'{df_name}[{transpiled_column_header}] = pd.to_datetime({df_name}[{transpiled_column_header}], errors=\'coerce\')'
        elif is_timedelta_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = pd.to_timedelta({df_name}[{transpiled_column_header}], errors=\'coerce\')'
    elif is_datetime_dtype(old_dtype):
        if is_bool_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = ~{df_name}[{transpiled_column_header}].isnull()'
        elif is_int_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].astype(\'int\') / 10**9'
        elif is_float_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].astype(\'int\').astype(\'float\') / 10**9'
        elif is_string_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].dt.strftime(\'%Y-%m-%d %X\')'
        elif is_datetime_dtype(new_dtype):
            return None
        elif is_timedelta_dtype(new_dtype):
            raise make_invalid_column_type_change_error(
                column_header,
                old_dtype,
                new_dtype
            )
    elif is_timedelta_dtype(old_dtype):
        if is_bool_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = ~{df_name}[{transpiled_column_header}].isnull()'
        elif is_int_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].dt.total_seconds().astype(\'int\')'
        elif is_float_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].dt.total_seconds()'
        elif is_string_dtype(new_dtype):
            return f'{df_name}[{transpiled_column_header}] = {df_name}[{transpiled_column_header}].astype(\'str\')'
        elif is_datetime_dtype(new_dtype):
            raise make_invalid_column_type_change_error(
                column_header,
                old_dtype,
                new_dtype
            )
        elif is_timedelta_dtype(new_dtype):
            return None

    return None
    



class ChangeColumnDtypeCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, sheet_index: int, column_ids: List[ColumnID], old_dtypes: Dict[ColumnID, str], new_dtype: str, changed_column_ids: List[ColumnID], to_datetime_params_map: Optional[Dict[ColumnID, Dict[str, Any]]], public_interface_version: int):
        super().__init__(prev_state)
        self.sheet_index = sheet_index
        self.column_ids = column_ids
        self.old_dtypes = old_dtypes
        self.new_dtype = new_dtype
        self.changed_column_ids = changed_column_ids
        self.to_datetime_params_map = to_datetime_params_map
        self.public_interface_version = public_interface_version

        self.df_name = self.prev_state.df_names[self.sheet_index]
        self.column_headers = self.prev_state.column_ids.get_column_headers_by_ids(self.sheet_index, self.changed_column_ids)

    def get_display_name(self) -> str:
        return 'Changed dtype'
    
    def get_description_comment(self) -> str:
        return f'Changed {", ".join([str(ch) for ch in self.column_headers])} to dtype {self.new_dtype}'

    def get_code(self) -> Tuple[List[str], List[str]]:

        # Note: we can't actually group all the headers together in one conversion, and not every dtype can be converted
        # to the target dtype in the same way. Even if they have the same old_dtype, this still might not work in the case
        # of converting to datetimes. It ends up being really hard to actually group these together (>50+ lines of relatively
        # dense and complex code), so we avoid it for now.

        code = []
        for column_id in self.column_ids:
            old_dtype = self.old_dtypes[column_id]

            conversion_code = get_conversion_code(self.prev_state, self.sheet_index, column_id, old_dtype, self.new_dtype, self.to_datetime_params_map, self.public_interface_version)
            if conversion_code is not None:
                code.append(conversion_code)
        
        # If we have pandas included, then add pandas as an import
        return code, ['import pandas as pd'] if any('pd.to_datetime' in line for line in code) else []

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]