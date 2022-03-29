#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import numpy as np
from mitosheet.errors import (make_cast_value_to_type_error,
                              make_no_column_error)
from mitosheet.sheet_functions.types import get_function_to_convert_to_series
from mitosheet.sheet_functions.types.utils import (is_bool_dtype, is_int_dtype,
                                                   is_none_type,
                                                   is_number_dtype,
                                                   is_string_dtype,
                                                   is_datetime_dtype,
                                                   is_timedelta_dtype)
from mitosheet.state import State
from mitosheet.step_performers.column_steps.set_column_formula import (
    refresh_dependant_columns, transpile_dependant_columns)
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code
from mitosheet.types import ColumnID


class SetCellValueStepPerformer(StepPerformer):
    """
    A set_cell_value step, allows you to set the value
    of a given cell in the sheet and then recalculates it's dependents.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'set_cell_value'

    @classmethod
    def step_display_name(cls) -> str:
        return 'Set Cell Value'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        # Mito doesn't allow empty cells, so if the new value is empty, change it to None.
        if params['new_value'] == '':
            params['new_value'] = None

        # Get the old value so we can check if the new value is different
        sheet_index = params['sheet_index']
        column_id = params['column_id']
        row_index = params['row_index']
        column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)

        # Cast the old value to a string to avoid errors while writing the saved analysis
        params['old_value'] = str(prev_state.dfs[sheet_index].at[row_index, column_header])
        
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        sheet_index: int,
        column_id: ColumnID,
        row_index: int,
        old_value: str,
        new_value: Union[str, None],
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:
        if column_id not in prev_state.column_spreadsheet_code[sheet_index]:
            raise make_no_column_error({column_id}, error_modal=False)

        # If nothings changed, there's no work to do
        if old_value == new_value:
            return prev_state, None

        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        column_header = post_state.column_ids.get_column_header_by_id(sheet_index, column_id)

        # Update the value of the cell, we handle it differently depending on the type of the column
        column_dtype = str(post_state.dfs[sheet_index][column_header].dtype)
        type_corrected_new_value = cast_value_to_type(new_value, column_dtype)

        # If the series is an int, but the new value is a float, convert the series to floats before adding the new value
        column_dtype = str(post_state.dfs[sheet_index][column_header].dtype)
        if new_value is not None and '.' in new_value and is_int_dtype(column_dtype):
            post_state.dfs[sheet_index][column_header] = post_state.dfs[sheet_index][column_header].astype('float')
        
        # Actually update the cell's value
        pandas_start_time = perf_counter()
        post_state.dfs[sheet_index].at[row_index, column_header] = type_corrected_new_value
        pandas_processing_time = perf_counter() - pandas_start_time

        # Update the column formula, and then execute the new formula graph
        refresh_dependant_columns(post_state, post_state.dfs[sheet_index], sheet_index, column_id)

        return post_state, {
            'type_corrected_new_value': type_corrected_new_value,
            'pandas_processing_time': pandas_processing_time
        }

    @classmethod
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        sheet_index: int,
        column_id: ColumnID,
        row_index: int,
        old_value: str,
        new_value: Union[str, None],
    ) -> List[str]:
        code: List[str] = []

        # If nothings changed, we don't write any code
        if old_value == new_value:
            return code

        # Cast the new_value to the correct type
        type_corrected_new_value = execution_data['type_corrected_new_value'] if execution_data else None

        column_header = post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        transpiled_column_header = column_header_to_transpiled_code(column_header)

        # If the series is an int, but the new value is a float, convert the series to floats before adding the new value
        column_dtype = str(prev_state.dfs[sheet_index][column_header].dtype)
        if new_value is not None and '.' in new_value and is_int_dtype(column_dtype):
            code.append(f'{post_state.df_names[sheet_index]}[{transpiled_column_header}] = {post_state.df_names[sheet_index]}[\'{column_header}\'].astype(\'float\')')

        # Actually set the new value
        # We don't need to wrap the value in " if its None, a Boolean Series, or a Number Series.
        if type_corrected_new_value is None or is_bool_dtype(column_dtype) or is_number_dtype(column_dtype):
            code.append(f'{post_state.df_names[sheet_index]}.at[{row_index}, {transpiled_column_header}] = {type_corrected_new_value}')
        elif is_datetime_dtype(column_dtype):
            code.append(f'{post_state.df_names[sheet_index]}.at[{row_index}, {transpiled_column_header}] = pd.to_datetime(\"{type_corrected_new_value}\")')
        elif is_timedelta_dtype(column_dtype):
            code.append(f'{post_state.df_names[sheet_index]}.at[{row_index}, {transpiled_column_header}] = pd.to_timedelta(\"{type_corrected_new_value}\")')
        else:
            code.append(f'{post_state.df_names[sheet_index]}.at[{row_index}, {transpiled_column_header}] = \"{type_corrected_new_value}\"')

        # Add the transpiled code for all of the dependant columns inorder to refresh the dependant cells
        code = code + transpile_dependant_columns(post_state, sheet_index, column_id)
        return code


    @classmethod
    def describe( # type: ignore
        cls,
        sheet_index: int,
        column_id: ColumnID,
        row_index: int,
        old_value: str,
        new_value: Union[str, None],
        df_names=None,
        **params
    ) -> str:
        # Note: Since we don't have access to the dataframes, we can't run the new_value
        # through cast_value_to_type which might change the actual value. Therefore, the new_value
        # that is used in the comment might be incorrect.
        if df_names is not None:
            df_name = df_names[sheet_index]
            return f'Set column {column_id} at index {row_index} in {df_name} to {new_value}'
        return f'Set column {column_id} at index {row_index} to {new_value}'

    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        column_id: ColumnID,
        row_index: int,
        old_value: str,
        new_value: Union[str, None],
        **params
    ) -> Set[int]:
        return {sheet_index}


def cast_value_to_type(value: Union[str, None], column_dtype: str) -> Optional[Any]:
    """
    Helper function for converting a value into the correct type for the 
    series that it is going to be added to. 
    """
    # If the user is trying to make the value None, let them.
    if is_none_type(value) or value is None:
        return None

    try:
        conversion_function = get_function_to_convert_to_series(column_dtype)
        casted_value_series = conversion_function(value, on_uncastable_arg_element=np.NaN)

        type_corrected_new_value = casted_value_series.iat[0]

        # If the value is a string and it has a " in it, replace it with a ' so the transpiled code does not error
        if is_string_dtype(column_dtype) and '"' in type_corrected_new_value:
            type_corrected_new_value = type_corrected_new_value.replace('"', "'")

        # If the typed value is not a float, then we do not make it one
        if is_number_dtype(column_dtype) and '.' not in value:
            return round(type_corrected_new_value)

        return type_corrected_new_value
    except:
        raise make_cast_value_to_type_error(value, column_dtype, error_modal=False)
