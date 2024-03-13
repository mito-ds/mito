#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Set, Tuple, Union

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import FC_LEAST_FREQUENT, FC_MOST_FREQUENT, FC_NUMBER_HIGHEST, FC_NUMBER_LOWEST, ColumnHeader, ColumnID, Filter, FilterGroup, OperatorType, StepType


# If there are multiple conditions, we combine them together, with the
# given operator in the middle
OPERATOR_SIGNS = {"Or": "|", "And": "&"}

# Filter conditions that cannot be applied to the first 1500 rows of the dataframe 
# should be put here. They require different handling in conditonal formats, for example
FILTER_CONDITIONS_THAT_REQUIRE_FULL_DATAFRAME = [
    FC_LEAST_FREQUENT,
    FC_MOST_FREQUENT,
    FC_NUMBER_LOWEST,
    FC_NUMBER_HIGHEST,
]

class FilterStepPerformer(StepPerformer):
    """
    Allows you to filter a column based on some conditions and some values.
    """

    @classmethod
    def step_version(cls) -> int:
        return 4

    @classmethod
    def step_type(cls) -> str:
        return "filter_column"

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any], previous_steps: List[StepType]) -> Dict[str, Any]:
        """
        Saturates the filter event with a `has_non_empty_filter` - which is useful
        for for logging
        """
        has_non_empty_filter = False
        for filter_or_group in params["filters"]:
            if "filters" in filter_or_group:
                # If it's a group
                if len(filter_or_group["filters"]) > 0:
                    has_non_empty_filter = True
            else:
                # If it's a single filter
                has_non_empty_filter = True

        params["has_non_empty_filter"] = has_non_empty_filter
        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:

        post_state, execution_data = cls.execute_through_transpile(prev_state, params)

        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        operator: OperatorType = get_param(params, 'operator')
        filters: Any = get_param(params, 'filters')

        # Keep track of which columns are filtered
        post_state.column_filters[sheet_index][column_id]["operator"] = operator
        post_state.column_filters[sheet_index][column_id]["filters"] = filters

        return post_state, execution_data

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        from mitosheet.code_chunks.step_performers.filter_code_chunk import \
            FilterCodeChunk
        return [
            FilterCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),
                [{
                    'column_id': get_param(params, 'column_id'),
                    'filter': {
                        'operator': get_param(params, 'operator'),
                        'filters': get_param(params, 'filters')
                    }
                }]
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {get_param(params, 'sheet_index')}

def check_filters_contain_condition_that_needs_full_df(filters: List[Union[Filter, FilterGroup]]) -> bool:
    """
    Returns true if any filter condition is a FILTER_CONDITIONS_THAT_REQUIRE_FULL_DATAFRAME
    """

    for filter_or_group in filters:

        if 'filters' not in filter_or_group:
            filter_: Filter = filter_or_group #type: ignore
            if filter_['condition'] in FILTER_CONDITIONS_THAT_REQUIRE_FULL_DATAFRAME:
                return True
        else:
            filter_group: FilterGroup = filter_or_group #type: ignore
            if check_filters_contain_condition_that_needs_full_df(filter_group["filters"]):
                return True
        
    return False
