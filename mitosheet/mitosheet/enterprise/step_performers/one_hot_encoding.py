
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of The Mito Enterprise license.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.one_hot_encoding_code_chunk import OneHotEncodingCodeChunk
from mitosheet.errors import make_column_exists_error, make_columns_exists_error

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import add_columns_to_df, get_param
from mitosheet.types import ColumnID

class OneHotEncodingStepPerformer(StepPerformer):
    """
    Allows you to do a one hot encoding of a column.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'one_hot_encoding'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')

        # We make a new state to modify it
        post_state = prev_state.copy()

        column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        df = post_state.dfs[sheet_index]
        column_index = df.columns.tolist().index(column_header)

        pandas_start_time = perf_counter()
        new_columns = pd.get_dummies(df[column_header])
        pandas_processing_time = perf_counter() - pandas_start_time

        # TODO: make sure there isn't overlap here?
        new_column_headers = new_columns.columns.tolist()

        # If there is overlap between the new column headers and the existing df, then
        # we throw an error about this overlap
        if len(set(new_column_headers) & set(df.columns.tolist())) > 0:
            raise make_columns_exists_error(set(new_column_headers) & set(df.columns.tolist()))
            
        final_df = add_columns_to_df(df, new_columns, new_column_headers, column_index)
        post_state.dfs[sheet_index] = final_df
        # Update column state variables
        post_state.add_columns_to_state(sheet_index, new_column_headers)

        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'new_column_headers': new_column_headers,
            'result': {
                # TODO: fill in the result
            }
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
            OneHotEncodingCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'sheet_index'), 
                get_param(params, 'column_id'), 
                get_param(execution_data if execution_data is not None else {}, 'new_column_headers')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
    