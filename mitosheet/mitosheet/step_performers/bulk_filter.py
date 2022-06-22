
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np

import pandas as pd
from mitosheet.api.get_unique_value_counts import get_matching_values
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.filter_code_chunk import FilterCodeChunk

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID

BULK_FILTER_TOGGLE_SPECIFIC_VALUE = 'toggle_specific_value'
BULK_FILTER_TOGGLE_ALL_MATCHING = 'toggle_all_matching'

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
        # We fill this up with the previous values at the time the event is set, 
        # so that even though that previous bulk filter step is skipped, we still have
        # access to the previous bulk filter and filtered out values
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')

        params['bulk_filter'] = prev_state.column_filters[sheet_index][column_id]['bulk_filter']

        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        toggle_type: Any = get_param(params, 'toggle_type') # {type: 'toggle_all_matching', toggle_value: boolean, search_string: string} | {type: 'toggle_specific_value', value: specific value}

        # This parameter is saturated above
        bulk_filter: Any = get_param(params, 'bulk_filter')

        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])
        if toggle_type['type'] == BULK_FILTER_TOGGLE_SPECIFIC_VALUE:
            values_to_toggle = set([toggle_type['value']])
            remove_from_dataframe = toggle_type['remove_from_dataframe'] # if true, filtering out, and if false, adding back
        elif toggle_type['type'] == BULK_FILTER_TOGGLE_ALL_MATCHING:
            values_to_toggle = get_matching_values(post_state, sheet_index, column_id, toggle_type['search_string'])
            remove_from_dataframe = toggle_type['remove_from_dataframe']

        # If the values to toggle include NaN, then we switch this out for NaN proper
        if 'NaN' in values_to_toggle:
            values_to_toggle.remove('NaN')
            values_to_toggle.add(np.NaN)
        
        new_values = copy(set(bulk_filter['value']))

        # Update the values and filtered out lists
        if remove_from_dataframe:
            new_values.update(values_to_toggle)
        else:
            new_values = copy(new_values).difference(values_to_toggle)

        post_state.column_filters[sheet_index][column_id]['bulk_filter']['value'] = new_values


        # Then execute the filter
        from mitosheet.step_performers.filter import _execute_filter
        _, pandas_processing_time = _execute_filter(
            post_state,
            sheet_index,
            column_id,
            post_state.column_filters[sheet_index][column_id]['filter_list'],
            post_state.column_filters[sheet_index][column_id]['bulk_filter']
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
            FilterCodeChunk(prev_state, post_state, params, execution_data)
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}
    