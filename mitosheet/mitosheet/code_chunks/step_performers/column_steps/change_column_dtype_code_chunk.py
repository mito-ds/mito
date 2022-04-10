#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk

from mitosheet.errors import make_invalid_column_type_change_error
from mitosheet.sheet_functions.types.utils import (get_datetime_format,
                                                   is_bool_dtype,
                                                   is_datetime_dtype,
                                                   is_float_dtype,
                                                   is_int_dtype,
                                                   is_string_dtype,
                                                   is_timedelta_dtype)
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code



class ChangeColumnDtypeCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Changed dtype'
    
    def get_description_comment(self) -> str:
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        new_dtype = self.get_param('new_dtype')
        column_header = self.post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        return f'Changed {column_header} to dtype {new_dtype}'

    def get_code(self) -> List[str]:
        sheet_index = self.get_param('sheet_index')
        column_id = self.get_param('column_id')
        old_dtype = self.get_param('old_dtype')
        new_dtype = self.get_param('new_dtype')

        df_name = self.post_state.df_names[sheet_index]
        column_header = self.post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)

        column = self.prev_state.dfs[sheet_index][column_header]

        conversion_code = f'{df_name}[{transpiled_column_header}]'
        if is_bool_dtype(old_dtype):
            if is_bool_dtype(new_dtype):
                pass
            elif is_int_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].astype(\'int\')'
            elif is_float_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].astype(\'float\')'
            elif is_string_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].astype(\'str\')'
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
                conversion_code = f'{df_name}[{transpiled_column_header}].fillna(False).astype(\'bool\')'
            elif is_int_dtype(new_dtype):
                pass
            elif is_float_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].astype(\'float\')'
            elif is_string_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].astype(\'str\')'
            elif is_datetime_dtype(new_dtype):
                conversion_code = f'pd.to_datetime({df_name}[{transpiled_column_header}], unit=\'s\', errors=\'coerce\')'
            elif is_timedelta_dtype(new_dtype):
                conversion_code = f'pd.to_timedelta({df_name}[{transpiled_column_header}], unit=\'s\', errors=\'coerce\')'
        elif is_float_dtype(old_dtype):
            if is_bool_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].fillna(False).astype(\'bool\')'
            elif is_int_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].fillna(0).astype(\'int\')'
            elif is_float_dtype(new_dtype):
                pass
            elif is_string_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].astype(\'str\')'
            elif is_datetime_dtype(new_dtype):
                conversion_code = f'pd.to_datetime({df_name}[{transpiled_column_header}], unit=\'s\', errors=\'coerce\')'
            elif is_timedelta_dtype(new_dtype):
                conversion_code = f'pd.to_timedelta({df_name}[{transpiled_column_header}], unit=\'s\', errors=\'coerce\')'
        elif is_string_dtype(old_dtype):
            if is_bool_dtype(new_dtype):
                conversion_code = f'to_boolean_series({df_name}[{transpiled_column_header}])'
            elif is_int_dtype(new_dtype):
                conversion_code = f'to_int_series({df_name}[{transpiled_column_header}])'
            elif is_float_dtype(new_dtype):
                conversion_code = f'to_float_series({df_name}[{transpiled_column_header}])'
            elif is_string_dtype(new_dtype):
                pass
            elif is_datetime_dtype(new_dtype):
                # Guess the datetime format to the best of Pandas abilities
                datetime_format = get_datetime_format(column)
                if datetime_format is not None:
                    conversion_code = f'pd.to_datetime({df_name}[{transpiled_column_header}], format=\'{datetime_format}\', errors=\'coerce\')'
                else:
                    conversion_code = f'pd.to_datetime({df_name}[{transpiled_column_header}], infer_datetime_format=True, errors=\'coerce\')'
            elif is_timedelta_dtype(new_dtype):
                conversion_code = f'pd.to_timedelta({df_name}[{transpiled_column_header}], errors=\'coerce\')'
        elif is_datetime_dtype(old_dtype):
            if is_bool_dtype(new_dtype):
                conversion_code = f'~{df_name}[{transpiled_column_header}].isnull()'
            elif is_int_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].astype(\'int\') / 10**9'
            elif is_float_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].astype(\'int\').astype(\'float\') / 10**9'
            elif is_string_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].dt.strftime(\'%Y-%m-%d %X\')'
            elif is_datetime_dtype(new_dtype):
                pass
            elif is_timedelta_dtype(new_dtype):
                raise make_invalid_column_type_change_error(
                    column_header,
                    old_dtype,
                    new_dtype
                )
        elif is_timedelta_dtype(old_dtype):
            if is_bool_dtype(new_dtype):
                conversion_code = f'~{df_name}[{transpiled_column_header}].isnull()'
            elif is_int_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].dt.total_seconds().astype(\'int\')'
            elif is_float_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].dt.total_seconds()'
            elif is_string_dtype(new_dtype):
                conversion_code = f'{df_name}[{transpiled_column_header}].astype(\'str\')'
            elif is_datetime_dtype(new_dtype):
                raise make_invalid_column_type_change_error(
                    column_header,
                    old_dtype,
                    new_dtype
                )
            elif is_timedelta_dtype(new_dtype):
                pass

        code = [f'{df_name}[{transpiled_column_header}] = {conversion_code}']
        # If we have pandas included, then add pandas to the transpiled code
        if 'pd.to_datetime' in conversion_code:
            code.insert(0, 'import pandas as pd')

        return code

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.get_param('sheet_index')]