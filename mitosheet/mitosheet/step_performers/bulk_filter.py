
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.bulk_filter_code_chunk import BulkFilterCodeChunk

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID

BULK_FILTER_TOGGLE_SPECIFIC_VALUE = 'toggle_specific_value'
BULK_FILTER_CONDITION_IS_EXACTLY = 'bulk_is_exactly'
BULK_FILTER_CONDITION_IS_NOT_EXACTLY = 'bulk_is_not_exactly'

class BulkFilterStepPerformer(StepPerformer):
    """
    Allows you to bulk filter.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'bulk_filter'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        toggle_type: Any = get_param(params, 'toggle_type') # {type: 'toggle_all_matching', toggle_value: boolean, search_string: string} | {type: 'toggle_specific_value', value: specific value}

        # We make a new state to modify it
        post_state = prev_state.copy() # TODO: update the deep copies

        column_header = post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        bulk_filter  = post_state.column_filters[sheet_index][column_id]['bulk_filter']
        current_values = post_state.dfs[sheet_index][column_header]
        filtered_out_values = post_state.column_filters['filtered_out_values']

        if toggle_type['type'] == BULK_FILTER_TOGGLE_SPECIFIC_VALUE:
            value = toggle_type['value']

            new_values = [value for value in bulk_filter['value']]

            if value in new_values:
                new_values.remove(value)
            else:
                new_values.append(value)

            bulk_filter['value'] = new_values
        else:
            # We are toggling all matching values
            pass

        from mitosheet.step_performers.filter import _execute_filter
        pandas_processing_time = _execute_filter(
            post_state,
            sheet_index,
            column_id,
            post_state.column_filters['filter_list'],
            bulk_filter
        )

        return post_state, {
            'pandas_processing_time': pandas_processing_time,
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
            BulkFilterCodeChunk(prev_state, post_state, params, execution_data)
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')} # TODO: add the modified indexes here!
    