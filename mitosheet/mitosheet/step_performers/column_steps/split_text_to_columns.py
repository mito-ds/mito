#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.column_steps.split_text_to_columns_code_chunk import (
    SplitTextToColumnsCodeChunk, get_split_param_dict)
from mitosheet.is_type_utils import is_datetime_dtype, is_timedelta_dtype
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
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
            
        # Create a new post state
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])
        final_df = post_state.dfs[sheet_index]
        delimiter_string = '|'.join(delimiters)
            
        split_param_dict = get_split_param_dict()

        # Create the dataframe of new columns. We do this first, so that we know how many columns get created.
        if is_datetime_dtype(str(post_state.dfs[sheet_index][column_header].dtype)):
            new_columns_df = final_df[column_header].dt.strftime('%Y-%m-%d %X').str.split(delimiter_string, **split_param_dict)
        elif is_timedelta_dtype(str(post_state.dfs[sheet_index][column_header].dtype)):
            new_columns_df = final_df[column_header].apply(lambda x: str(x)).str.split(delimiter_string, **split_param_dict)
        else:
            new_columns_df = final_df[column_header].astype('str').str.split(delimiter_string, **split_param_dict)

        # Create the new column headers and ensure they are unique
        # Note: We create the new_column_header_suffix on the frontend so that it is saved in the step parameters, which allows us
        # to replay the analysis and generate the same columns. 
        new_column_headers: List[ColumnHeader] = [f'{column_header}-split-{idx}-{new_column_header_suffix}' for column, idx in enumerate(new_columns_df)]

        execution_data = {
            'new_column_headers': new_column_headers
        }

        post_state, execution_data = cls.execute_through_transpile(
            prev_state,
            params,
            execution_data
        )

        return post_state, {
            **execution_data,
            'result': {
                'num_cols_created': len(new_column_headers)
            }
        }

        
    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            SplitTextToColumnsCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'column_id'),
                get_param(params, 'delimiters'),
                execution_data.get('new_column_headers', []) if execution_data is not None else []
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
