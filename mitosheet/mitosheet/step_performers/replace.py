
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import re
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
import pandas as pd
from mitosheet.code_chunks.replace_code_chunk import ReplaceCodeChunk, convert_to_original_type_or_str

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.public.v3.types.bool import cast_string_to_bool
from mitosheet.errors import MitoError
from mitosheet.step_performers.column_steps.rename_column import rename_column_headers_in_state
from mitosheet.errors import make_invalid_replace_error
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import ColumnID

class ReplaceStepPerformer(StepPerformer):
    """
    Allows you to replace a search value with a replace value in a sheet for both
    the values in the cells and the column headers.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'replace'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        search_value: str = get_param(params, 'search_value')
        replace_value: str = get_param(params, 'replace_value')
        column_ids: List[ColumnID] = get_param(params, 'column_ids')

        # We make a new state to modify it
        post_state = prev_state.copy() 

        pandas_start_time = perf_counter()
        df = post_state.dfs[sheet_index]

        # If no column_ids are specified, then we replace the values in all columns
        if column_ids is None or len(column_ids) == 0:
            column_ids = post_state.column_ids.get_column_ids(sheet_index)

        column_headers = post_state.column_ids.get_column_headers_by_ids(sheet_index, column_ids)

        # Selected columns is the dataframe with only the columns we want to replace values in
        df_only_selected_columns = df[column_headers]

        # Raise an error if the pandas version is too old to use timedelta with replace.
        if (any(df_only_selected_columns.dtypes == 'timedelta') and pd.__version__ < 1.4):
            raise MitoError(
                'version_error',
                'Pandas version error',
                'This version of pandas doesn\'t support replacing values in timedelta columns. Please upgrade to pandas 1.2 or later.',
            )
        
        try:
            search_value_regex = f'(?i){search_value}'
            # Special case for boolean columns because when we convert to string, the values are 
            # all converted back to bool as True - even if the value is "False". 
            if any(df_only_selected_columns.dtypes == 'bool'):
                bool_columns = df_only_selected_columns.select_dtypes(include='bool')
                non_bool_columns = df_only_selected_columns.select_dtypes(exclude='bool')
                df_only_selected_columns[bool_columns.columns] = bool_columns.astype(str).replace(search_value_regex, replace_value, regex=True).applymap(cast_string_to_bool).astype(bool)
                df_only_selected_columns[non_bool_columns.columns] = non_bool_columns.astype(str).replace(search_value_regex, replace_value, regex=True).astype(non_bool_columns.dtypes.to_dict())
            else:
                df_only_selected_columns = df_only_selected_columns.astype(str).replace(search_value_regex, replace_value, regex=True).astype(df_only_selected_columns.dtypes.to_dict())

            # Then, we replace the column headers in the state column_ids object
            # We convert the column headers to strings because the column headers can be any type
            new_columns = [convert_to_original_type_or_str(re.sub(search_value_regex, replace_value, str(column)), type(column)) for column in df_only_selected_columns.columns]

            # Update the column headers in the state column_ids object
            for old_column_name, new_column_name in zip(df_only_selected_columns.columns, new_columns):
                # If the column name didn't change, then we don't need to do anything
                if old_column_name == new_column_name:
                    continue
                column_id = post_state.column_ids.get_column_id_by_header(sheet_index, old_column_name)
                post_state.column_ids.set_column_header(sheet_index, column_id, new_column_name)

            # Replace the selected columns in the actual dataframe
            df[column_headers] = df_only_selected_columns

            # Finally, we replace the column headers in the dataframe
            df.rename(columns=dict(zip(column_headers, new_columns)), inplace=True)
            post_state.dfs[sheet_index] = df
        except Exception as e:
            raise make_invalid_replace_error(search_value, replace_value)
        pandas_processing_time = perf_counter() - pandas_start_time
        return post_state, {
            'pandas_processing_time': pandas_processing_time
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            ReplaceCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'column_ids'),
                get_param(params, 'search_value'),
                get_param(params, 'replace_value'),
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
    