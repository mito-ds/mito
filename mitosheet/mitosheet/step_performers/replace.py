
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
import pandas as pd
from mitosheet.code_chunks.replace_code_chunk import ReplaceCodeChunk

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.public.v3.types.bool import cast_string_to_bool
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import ColumnID

import re

class ReplaceStepPerformer(StepPerformer):
    """
    Allows you to replace.
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
        bool_columns = df.select_dtypes(include='bool')
        if bool_columns.any().any():
            non_bool_columns = df.select_dtypes(exclude='bool')
            df[bool_columns.columns] = bool_columns.astype(str).replace(f'(?i){search_value}', replace_value, regex=True).map(cast_string_to_bool)
            df[non_bool_columns.columns] = non_bool_columns.astype(str).replace(f'(?i){search_value}', replace_value, regex=True).astype(non_bool_columns.dtypes.to_dict())
        else:
            df = df.astype(str).replace(f'(?i){search_value}', replace_value).astype(df.dtypes.to_dict())
        post_state.dfs[sheet_index] = df
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
    