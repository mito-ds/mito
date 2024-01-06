#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.sort_code_chunk import SortCodeChunk
from mitosheet.errors import make_invalid_sort_error
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import ColumnID

# CONSTANTS USED IN THE SORT STEP ITSELF
SORT_DIRECTION_ASCENDING = 'ascending'
SORT_DIRECTION_DESCENDING = 'descending'
SORT_DIRECTION_NONE = 'none'

class SortStepPerformer(StepPerformer):
    """
    Allows you to sort a df based on key column, in either
    ascending or descending order.
    """

    @classmethod
    def step_version(cls) -> int:
        return 2

    @classmethod
    def step_type(cls) -> str:
        return 'sort'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        try: 
            return cls.execute_through_transpile(
                prev_state, 
                params, 
            )
        except TypeError as e:
            # A TypeError occurs when you try to sort a column with incomparable 
            # dtypes (ie: a column with strings and floats)
            
            sheet_index: int = get_param(params, 'sheet_index')
            column_id: ColumnID = get_param(params, 'column_id')
            column_header = prev_state.column_ids.get_column_header_by_id(sheet_index, column_id)

            raise make_invalid_sort_error(column_header)


    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            SortCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'column_id'),
                get_param(params, 'sort_direction')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
