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
from mitosheet.state import FORMAT_DEFAULT, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID

def get_new_colum_header_unique_component() -> str:
    return ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(4))


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
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        delimiters: List[str] = get_param(params, 'delimiters')

        column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        column_id_index = prev_state.dfs[sheet_index].columns.tolist().index(column_id)
            
        # Create a new post state
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])
        final_df = post_state.dfs[sheet_index]
        delimiter_string = '|'.join(delimiters)

        # Actually execute the column reordering
        # TODO: Where should I put the pandas_start_time and end time?
        pandas_start_time = perf_counter() 
        # Create the dataframe of new columns. We do this first, so that we know how many columns get created.
        new_columns_df = final_df[column_id].astype('str').str.split(delimiter_string, -1, expand=True)
        # Create the new column headers and ensure they are unique
        new_column_headers = [f'split-{idx}-of-{column_header}-{get_new_colum_header_unique_component()}' for column, idx in enumerate(new_columns_df)]
        # Make sure the new column headers are valid before adding them to the dataframe
        new_column_headers = [try_make_new_header_valid_if_multi_index_headers(list(prev_state.column_ids.column_id_to_column_header[sheet_index].values()), column_header) for column_header in new_column_headers]
        # Add the new columns to the end of the dataframe
        final_df[new_column_headers] = new_columns_df
        # Set the columns in the correct order
        final_df = final_df[final_df.columns[:column_id_index + 1].tolist() + new_column_headers + final_df.columns[column_id_index + 1:-len(new_column_headers)].tolist()]
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
            'new_column_headers': new_column_headers
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
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        sheet_index: int,
        **params
    ) -> Set[int]:
        return {sheet_index}
