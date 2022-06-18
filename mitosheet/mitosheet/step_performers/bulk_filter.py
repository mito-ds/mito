
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.filter_code_chunk import FilterCodeChunk

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
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        # We fill this up with the previous values 
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')

        params['bulk_filter'] = prev_state.column_filters[sheet_index][column_id]['bulk_filter']
        params['filtered_out_values'] = prev_state.column_filters[sheet_index][column_id]['filtered_out_values']

        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        toggle_type: Any = get_param(params, 'toggle_type') # {type: 'toggle_all_matching', toggle_value: boolean, search_string: string} | {type: 'toggle_specific_value', value: specific value}
        bulk_filter: Any = get_param(params, 'bulk_filter')
        filtered_out_values: Any = get_param(params, 'filtered_out_values')

        # We make a new state to modify it
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        if toggle_type['type'] == BULK_FILTER_TOGGLE_SPECIFIC_VALUE:
            value = toggle_type['value']
            remove_from_dataframe = toggle_type['remove_from_dataframe'] # if true, filtering out, and if false, adding back

            new_values = [value for value in bulk_filter['value']]
            new_filtered_out_values = [value for value in filtered_out_values]

            if bulk_filter['condition'] == BULK_FILTER_CONDITION_IS_EXACTLY:
                if remove_from_dataframe and value in new_values:
                    new_values.remove(value)
                    new_filtered_out_values.append(value)
                elif not remove_from_dataframe and value not in new_values:
                    new_values.append(value)
                    new_filtered_out_values.remove(value)
            elif bulk_filter['condition'] == BULK_FILTER_CONDITION_IS_NOT_EXACTLY:
                if remove_from_dataframe and value not in new_values:
                    new_values.append(value)
                    new_filtered_out_values.append(value)
                elif not remove_from_dataframe and value in new_values:
                    new_values.remove(value)
                    new_filtered_out_values.remove(value)
            else:
                raise Exception(f'Invalid bulk filter with condition {bulk_filter["condition"]}')

            # TODO: fix this weird bug, when we save, it saves the params but does not save the _final_ param, 
            # namely, the last item that was removed. Specifically, it doesn't add this last. Do we need to update
            # the params?

            post_state.column_filters[sheet_index][column_id]['bulk_filter']['value'] = new_values
            post_state.column_filters[sheet_index][column_id]['filtered_out_values'] = new_filtered_out_values

        else:
            # We are toggling all matching values
            pass

        from mitosheet.step_performers.filter import _execute_filter
        _, filtered_out_df, pandas_processing_time = _execute_filter(
            post_state,
            sheet_index,
            column_id,
            post_state.column_filters[sheet_index][column_id]['filter_list'],
            post_state.column_filters[sheet_index][column_id]['bulk_filter']
        )

        # Add this to the filtered out values
        
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
            FilterCodeChunk(prev_state, post_state, params, execution_data)
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')} # TODO: add the modified indexes here!
    