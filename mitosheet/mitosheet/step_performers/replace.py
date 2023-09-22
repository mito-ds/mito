
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import re
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
import pandas as pd
from mitosheet.code_chunks.replace_code_chunk import ReplaceCodeChunk

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
        

        # We make a new state to modify it
        post_state = prev_state.copy() 

        pandas_start_time = perf_counter()
        
        df = post_state.dfs[sheet_index]
        try:
            # Special case for boolean columns because when we convert to string, the values are 
            # all converted back to bool as True - even if the value is "False". 
            if any(df.dtypes == 'bool'):
                bool_columns = df.select_dtypes(include='bool')
                non_bool_columns = df.select_dtypes(exclude='bool')
                df[bool_columns.columns] = bool_columns.astype(str).replace(f'(?i){search_value}', replace_value, regex=True).map(cast_string_to_bool)
                df[non_bool_columns.columns] = non_bool_columns.astype(str).replace(f'(?i){search_value}', replace_value, regex=True).astype(non_bool_columns.dtypes.to_dict())
            else:
                df = df.astype(str).replace(f'(?i){search_value}', replace_value, regex=True).astype(df.dtypes.to_dict())

            # Then, we replace the search_value inside the column headers
            column_matches = [column for column in df.columns if re.search(re.compile(search_value, re.IGNORECASE), column)]
            # We replace in the dataframe *and* in the state column_ids object
            df.columns = df.columns.str.replace(f'(?i){search_value}', replace_value, regex=True)
            for column in column_matches:
                new_column_name = re.sub(re.compile(search_value, re.IGNORECASE), replace_value, column)
                column_id = post_state.column_ids.get_column_id_by_header(sheet_index, column)
                post_state.column_ids.set_column_header(sheet_index, column_id, new_column_name)

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
                get_param(params, 'search_value'),
                get_param(params, 'replace_value')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')} # TODO: add the modified indexes here!
    