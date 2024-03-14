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
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import ColumnHeader, ColumnID, Filter, FilterGroup, OperatorType, StepType
from mitosheet.types import (
    FC_BOOLEAN_IS_FALSE, FC_BOOLEAN_IS_TRUE, FC_DATETIME_EXACTLY,
    FC_DATETIME_GREATER, FC_DATETIME_GREATER_THAN_OR_EQUAL, FC_DATETIME_LESS,
    FC_DATETIME_LESS_THAN_OR_EQUAL, FC_DATETIME_NOT_EXACTLY, FC_EMPTY,
    FC_LEAST_FREQUENT, FC_MOST_FREQUENT, FC_NOT_EMPTY, FC_NUMBER_EXACTLY,
    FC_NUMBER_GREATER, FC_NUMBER_GREATER_THAN_OR_EQUAL, FC_NUMBER_HIGHEST,
    FC_NUMBER_LESS, FC_NUMBER_LESS_THAN_OR_EQUAL, FC_NUMBER_LOWEST,
    FC_NUMBER_NOT_EXACTLY, FC_STRING_CONTAINS, FC_STRING_DOES_NOT_CONTAIN,
    FC_STRING_ENDS_WITH, FC_STRING_EXACTLY, FC_STRING_NOT_EXACTLY,
    FC_STRING_STARTS_WITH, FC_STRING_CONTAINS_CASE_INSENSITIVE)


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
    elif condition == FC_STRING_CONTAINS_CASE_INSENSITIVE:
        return df[column_header].str.contains(value, na=False, regex=False, case=False)

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


def combine_filters(operator: OperatorType, filters: List[pd.Series]) -> pd.Series:
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
    operator: OperatorType,
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
