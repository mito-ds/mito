#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import functools
from datetime import date
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.errors import raise_error_if_column_ids_do_not_exist
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnHeader, ColumnID, Filter, FilterGroup, Operator

# The constants used in the filter step itself as filter conditions
# NOTE: these must be unique (e.g. no repeating names for different types)
FC_EMPTY = "empty"
FC_NOT_EMPTY = "not_empty"
FC_LEAST_FREQUENT = "least_frequent"
FC_MOST_FREQUENT = "most_frequent"

FC_BOOLEAN_IS_TRUE = "boolean_is_true"
FC_BOOLEAN_IS_FALSE = "boolean_is_false"

FC_STRING_CONTAINS = "contains"
FC_STRING_DOES_NOT_CONTAIN = "string_does_not_contain"
FC_STRING_EXACTLY = "string_exactly"
FC_STRING_NOT_EXACTLY = "string_not_exactly"
FC_STRING_STARTS_WITH = "string_starts_with"
FC_STRING_ENDS_WITH = "string_ends_with"

FC_NUMBER_EXACTLY = "number_exactly"
FC_NUMBER_NOT_EXACTLY = "number_not_exactly"
FC_NUMBER_GREATER = "greater"
FC_NUMBER_GREATER_THAN_OR_EQUAL = "greater_than_or_equal"
FC_NUMBER_LESS = "less"
FC_NUMBER_LESS_THAN_OR_EQUAL = "less_than_or_equal"
FC_NUMBER_LOWEST = 'number_lowest'
FC_NUMBER_HIGHEST = 'number_highest'

FC_DATETIME_EXACTLY = "datetime_exactly"
FC_DATETIME_NOT_EXACTLY = "datetime_not_exactly"
FC_DATETIME_GREATER = "datetime_greater"
FC_DATETIME_GREATER_THAN_OR_EQUAL = "datetime_greater_than_or_equal"
FC_DATETIME_LESS = "datetime_less"
FC_DATETIME_LESS_THAN_OR_EQUAL = "datetime_less_than_or_equal"

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
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
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
        sheet_index: int = get_param(params, 'sheet_index')
        column_id: ColumnID = get_param(params, 'column_id')
        operator: Operator = get_param(params, 'operator')
        filters: Any = get_param(params, 'filters')

        raise_error_if_column_ids_do_not_exist(
            'filter',
            prev_state,
            sheet_index,
            column_id
        )

        # Get the correct column_header
        column_header = prev_state.column_ids.get_column_header_by_id(
            sheet_index, column_id
        )

        # If no errors we create a new step for this filter
        post_state = prev_state.copy(deep_sheet_indexes=[sheet_index])

        # Execute the filter
        final_df, pandas_processing_time = _execute_filter(
            prev_state.dfs[sheet_index], column_header, operator, filters
        )
        post_state.dfs[sheet_index] = final_df

        # Keep track of which columns are filtered
        post_state.column_filters[sheet_index][column_id]["operator"] = operator
        post_state.column_filters[sheet_index][column_id]["filters"] = filters

        return post_state, {
            'pandas_processing_time': pandas_processing_time
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        from mitosheet.code_chunks.step_performers.filter_code_chunk import \
            FilterCodeChunk
        return [
            FilterCodeChunk(
                prev_state, 
                post_state, 
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


def get_applied_filter(
    df: pd.DataFrame, column_header: ColumnHeader, filter_: Filter
) -> pd.Series:
    """
    Given a filter triple, returns the filter indexes for that
    actual dataframe
    """
    condition = filter_["condition"]
    value = filter_["value"]

    # First, check shared filter conditions
    if condition == FC_EMPTY:
        return df[column_header].isna()
    elif condition == FC_NOT_EMPTY:
        return df[column_header].notnull()
    elif condition == FC_LEAST_FREQUENT:
        value_int: int = value # type: ignore
        return df[column_header].isin(df[column_header].value_counts().index.tolist()[-value_int:])
    elif condition == FC_MOST_FREQUENT:
        value_int: int = value # type: ignore
        return df[column_header].isin(df[column_header].value_counts().index.tolist()[:value_int])


    # Then bool
    if condition == FC_BOOLEAN_IS_TRUE:
        return df[column_header] == True
    elif condition == FC_BOOLEAN_IS_FALSE:
        return df[column_header] == False

    # Then string
    if condition == FC_STRING_CONTAINS:
        return df[column_header].str.contains(value, na=False, regex=False)
    elif condition == FC_STRING_DOES_NOT_CONTAIN:
        return ~df[column_header].str.contains(value, na=False, regex=False)
    elif condition == FC_STRING_STARTS_WITH:
        return df[column_header].str.startswith(value, na=False)
    elif condition == FC_STRING_ENDS_WITH:
        return df[column_header].str.endswith(value, na=False)
    elif condition == FC_STRING_EXACTLY:
        return df[column_header] == value
    elif condition == FC_STRING_NOT_EXACTLY:
        return df[column_header] != value

    # Then number
    if condition == FC_NUMBER_EXACTLY:
        return df[column_header] == value
    elif condition == FC_NUMBER_NOT_EXACTLY:
        return df[column_header] != value
    elif condition == FC_NUMBER_GREATER:
        return df[column_header] > value
    elif condition == FC_NUMBER_GREATER_THAN_OR_EQUAL:
        return df[column_header] >= value
    elif condition == FC_NUMBER_LESS:
        return df[column_header] < value
    elif condition == FC_NUMBER_LESS_THAN_OR_EQUAL:
        return df[column_header] <= value
    elif condition == FC_NUMBER_LOWEST:
        return df[column_header].isin(df[column_header].nsmallest(value, keep='all'))
    elif condition == FC_NUMBER_HIGHEST:
        return df[column_header].isin(df[column_header].nlargest(value, keep='all'))

    # Check that we were given something that can be understood as a date
    try:
        timestamp = pd.to_datetime(value)
    except:
        # If we hit an error, because we restrict the input datetime,
        # this is probably occuring because the user has only partially input the date,
        # and so in this case, we just default it to the minimum possible timestamp for now!
        timestamp = date.min

    if condition == FC_DATETIME_EXACTLY:
        return df[column_header] == timestamp
    elif condition == FC_DATETIME_NOT_EXACTLY:
        return df[column_header] != timestamp
    elif condition == FC_DATETIME_GREATER:
        return df[column_header] > timestamp
    elif condition == FC_DATETIME_GREATER_THAN_OR_EQUAL:
        return df[column_header] >= timestamp
    elif condition == FC_DATETIME_LESS:
        return df[column_header] < timestamp
    elif condition == FC_DATETIME_LESS_THAN_OR_EQUAL:
        return df[column_header] <= timestamp

    raise Exception(f"Invalid type passed in filter {filter_}")


def combine_filters(operator: Operator, filters: List[pd.Series]) -> pd.Series:
    def filter_reducer(filter_one: pd.Series, filter_two: pd.Series) -> pd.Series:
        # Helper for combining filters based on the operations
        if operator == "Or":
            return (filter_one) | (filter_two)
        elif operator == "And":
            return (filter_one) & (filter_two)
        else:
            raise Exception(f"Operator {operator} is unsupported")

    # Combine all the filters into a single filter
    return functools.reduce(filter_reducer, filters)

def get_full_applied_filter(
    df: pd.DataFrame,
    column_header: ColumnHeader,
    operator: Operator,
    filters: List[Union[Filter, FilterGroup]],
) -> Tuple[pd.Series, float]:
    applied_filters = []
    pandas_start_time = perf_counter()

    for filter_or_group in filters:
        if "filters" not in filter_or_group:
            filter_: Filter = filter_or_group #type: ignore
            applied_filters.append(get_applied_filter(df, column_header, filter_))
        else:
            filter_group: FilterGroup = filter_or_group #type: ignore
            full_group_filter, _ = get_full_applied_filter(df, column_header, filter_group['operator'], filter_group["filters"])
            applied_filters.append(full_group_filter)

    if len(applied_filters) > 0:
        full_applied_filter = combine_filters(operator, applied_filters)
    else:
        full_applied_filter = pd.Series(data=True, index=df.index, dtype='bool')
    
    pandas_processing_time = perf_counter() - pandas_start_time

    return (full_applied_filter, pandas_processing_time)



def _execute_filter(
    df: pd.DataFrame,
    column_header: ColumnHeader,
    operator: Operator,
    filters: List[Union[Filter, FilterGroup]],
) -> Tuple[pd.DataFrame, float]:
    """
    Executes a filter on the given column, filtering by removing any rows who
    don't meet the condition.
    """

    full_applied_filter, pandas_processing_time = get_full_applied_filter(df, column_header, operator, filters)
    return df[full_applied_filter], pandas_processing_time


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
