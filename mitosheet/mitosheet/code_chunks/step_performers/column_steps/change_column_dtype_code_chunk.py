#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID
from mitosheet.state import State

from mitosheet.errors import make_invalid_column_type_change_error
from mitosheet.sheet_functions.types.utils import ( is_bool_dtype,
                                                    is_datetime_dtype,
                                                    is_float_dtype,
                                                    is_int_dtype,
                                                    is_string_dtype,
                                                    is_timedelta_dtype)
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code


def get_conversion_code(state: State, sheet_index: int, column_id: ColumnID, old_dtype: str, new_dtype: str, datetime_formats: Optional[Dict[ColumnID, Optional[str]]]) -> Optional[str]:
    
    column_header = state.column_ids.get_column_header_by_id(sheet_index, column_id)
    transpiled_column_header = column_header_to_transpiled_code(column_header)
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
            if datetime_formats is not None:
                datetime_format = datetime_formats[column_id]
            else:
                # Just for safety, but we shouldn't hit this case
                datetime_format = None

            if datetime_format is not None:
                return f'{df_name}[{transpiled_column_header}] = pd.to_datetime({df_name}[{transpiled_column_header}], format=\'{datetime_format}\', errors=\'coerce\')'
            else:
                return f'{df_name}[{transpiled_column_header}] = pd.to_datetime({df_name}[{transpiled_column_header}], infer_datetime_format=True, errors=\'coerce\')'
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

    def get_display_name(self) -> str:
        return 'Changed dtype'
    
    def get_description_comment(self) -> str:
        sheet_index: int = self.get_param('sheet_index')
        new_dtype: str = self.get_param('new_dtype')
        changed_column_ids: List[ColumnID] = self.get_execution_data('changed_column_ids')
        column_headers = self.post_state.column_ids.get_column_headers_by_ids(sheet_index, changed_column_ids)
        return f'Changed {", ".join([str(ch) for ch in column_headers])} to dtype {new_dtype}'

    def get_code(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')
        column_ids = self.get_param('column_ids')
        old_dtypes = self.get_param('old_dtypes')
        new_dtype = self.get_param('new_dtype')
        datetime_formats = self.get_execution_data('datetime_formats')

        # Note: we can't actually group all the headers together in one conversion, and not every dtype can be converted
        # to the target dtype in the same way. Even if they have the same old_dtype, this still might not work in the case
        # of converting to datetimes. It ends up being really hard to actually group these together (>50+ lines of relatively
        # dense and complex code), so we avoid it for now.

        code = []
        for column_id in column_ids:
            old_dtype = old_dtypes[column_id]

            conversion_code = get_conversion_code(self.post_state, sheet_index, column_id, old_dtype, new_dtype, datetime_formats)
            if conversion_code is not None:
                code.append(conversion_code)
        
        # If we have pandas included, then add pandas to the transpiled code
        if any('pd.to_datetime' in line for line in code):
            code.insert(0, 'import pandas as pd')

        return code

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]