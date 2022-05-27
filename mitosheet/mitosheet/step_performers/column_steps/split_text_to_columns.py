#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
import random
import string
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
import uuid

import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.column_steps.split_text_to_columns_code_chunk import SplitTextToColumnsCodeChunk
from mitosheet.column_headers import try_make_new_header_valid_if_multi_index_headers
from mitosheet.sheet_functions.types.utils import is_datetime_dtype, is_timedelta_dtype
from mitosheet.state import FORMAT_DEFAULT, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnHeader, ColumnID

class SplitTextToColumnsStepPerformer(StepPerformer):
    """""
    A split_text_to_columns step, which allows you to separate 
    a single column into multiple columns by specifying a delimiter
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'split_text_to_columns'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        delimiters: List[str] = get_param(params, 'delimiters')
        new_column_header_suffix: str = get_param(params, 'new_column_header_suffix')

        column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        column_idx = prev_state.dfs[sheet_index].columns.tolist().index(column_header)
            
        # Create a new post state
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])
        final_df = post_state.dfs[sheet_index]
        delimiter_string = '|'.join(delimiters)
        # Actually execute the column reordering
        pandas_start_time = perf_counter() 
        # Create the dataframe of new columns. We do this first, so that we know how many columns get created.
        if is_datetime_dtype(str(post_state.dfs[sheet_index][column_header].dtype)):
            new_columns_df = final_df[column_header].dt.strftime('%Y-%m-%d %X').str.split(delimiter_string, -1, expand=True)
        elif is_timedelta_dtype(str(post_state.dfs[sheet_index][column_header].dtype)):
            new_columns_df = final_df[column_header].apply(lambda x: str(x)).str.split(delimiter_string, -1, expand=True)
        else:
            new_columns_df = final_df[column_header].astype('str').str.split(delimiter_string, -1, expand=True)

        # Create the new column headers and ensure they are unique
        # Note: We create the new_column_header_suffix on the frontend so that it is saved in the step parameters, which allows us
        # to replay the analysis and generate the same columns. 
        new_column_headers: List[ColumnHeader] = [f'{column_header}-split-{idx}-{new_column_header_suffix}' for column, idx in enumerate(new_columns_df)]
        # Make sure the new column headers are valid before adding them to the dataframe
        df_column_headers = prev_state.column_ids.get_column_headers(sheet_index)
        new_column_headers = [try_make_new_header_valid_if_multi_index_headers(df_column_headers, column_header) for column_header in new_column_headers]
        # Add the new columns to the end of the dataframe
        final_df[new_column_headers] = new_columns_df
        # Set the columns in the correct order
        final_df = final_df[final_df.columns[:column_idx + 1].tolist() + new_column_headers + final_df.columns[column_idx + 1:-len(new_column_headers)].tolist()]
        pandas_processing_time = perf_counter() - pandas_start_time
        # Update column state variables
        for column_header in new_column_headers:
            column_id = post_state.column_ids.add_column_header(sheet_index, column_header)
            post_state.column_spreadsheet_code[sheet_index][column_id] = ''
            post_state.column_filters[sheet_index][column_id] = {'operator': 'And', 'filters': []}
            post_state.column_format_types[sheet_index][column_id] = {'type': FORMAT_DEFAULT}

        post_state.dfs[sheet_index] = final_df

        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            # Save the new_column_headers so that the code chunk doesn't need to call .split to figure out how many columns were created
            'new_column_headers': new_column_headers,
            'result': {
                'num_cols_created': len(new_column_headers)
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
            SplitTextToColumnsCodeChunk(
                prev_state, 
                post_state, 
                params,
                execution_data
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
