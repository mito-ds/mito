#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.empty_code_chunk import EmptyCodeChunk
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID

class ChangeColumnFormatStepPerformer(StepPerformer):
    """"
    A change_column_format step, which allows you to change the format
    of a column(s)
    """
    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'change_column_format'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_ids: List[ColumnID] = get_param(params, 'column_ids')
        format_type: Dict[str, Any] = get_param(params, 'format_type')

        # Make a post state, that is a deep copy
        post_state = prev_state.copy()

        # Actually update the format of the columns
        for column_id in column_ids:
            update_column_id_format(post_state, sheet_index, column_id, format_type)

        # Add the num_cols_formatted to the execution data for logging purposes. 
        return post_state, {'num_cols_formatted': len(column_ids)}

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        # Formatting columns only effects the display in Mito, not the generated code.
        return [
            EmptyCodeChunk(
                prev_state, 
                post_state, 
                {
                    'display_name': 'Changed column format',
                    'description_comment': f'Changed the format of a {len(params["column_ids"])} columns to {params["format_type"]}',
                }, 
                execution_data
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}

def update_column_id_format(
    post_state: State,
    sheet_index: int,
    column_id: ColumnID,
    format_type: Dict[str, Any]
) -> State: 
    post_state.column_format_types[sheet_index][column_id] = format_type
    return post_state



