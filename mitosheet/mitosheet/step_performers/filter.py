#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import deepcopy
import functools
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple, Union
import pandas as pd
from datetime import date

from mitosheet.sheet_functions.types.utils import is_datetime_dtype
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import (
    column_header_to_transpiled_code,
    list_to_string_without_internal_quotes,
)
from mitosheet.types import ColumnHeader, ColumnID

# The constants used in the filter step itself as filter conditions
# NOTE: these must be unique (e.g. no repeating names for different types)
FC_EMPTY = "empty"
FC_NOT_EMPTY = "not_empty"

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

FC_DATETIME_EXACTLY = "datetime_exactly"
FC_DATETIME_NOT_EXACTLY = "datetime_not_exactly"
FC_DATETIME_GREATER = "datetime_greater"
FC_DATETIME_GREATER_THAN_OR_EQUAL = "datetime_greater_than_or_equal"
FC_DATETIME_LESS = "datetime_less"
FC_DATETIME_LESS_THAN_OR_EQUAL = "datetime_less_than_or_equal"

# Dict used when a filter condition is only used by one filter
FILTER_FORMAT_STRING_DICT = {
    # SHARED CONDITIONS
    FC_EMPTY: "{df_name}[{transpiled_column_header}].isna()",
    FC_NOT_EMPTY: "{df_name}[{transpiled_column_header}].notnull()",
    # BOOLEAN
    FC_BOOLEAN_IS_TRUE: "{df_name}[{transpiled_column_header}] == True",
    FC_BOOLEAN_IS_FALSE: "{df_name}[{transpiled_column_header}] == False",
    # NUMBERS
    FC_NUMBER_EXACTLY: "{df_name}[{transpiled_column_header}] == {value}",
    FC_NUMBER_NOT_EXACTLY: "{df_name}[{transpiled_column_header}] != {value}",
    FC_NUMBER_GREATER: "{df_name}[{transpiled_column_header}] > {value}",
    FC_NUMBER_GREATER_THAN_OR_EQUAL: "{df_name}[{transpiled_column_header}] >= {value}",
    FC_NUMBER_LESS: "{df_name}[{transpiled_column_header}] < {value}",
    FC_NUMBER_LESS_THAN_OR_EQUAL: "{df_name}[{transpiled_column_header}] <= {value}",
    # STRINGS
    FC_STRING_CONTAINS: "{df_name}[{transpiled_column_header}].str.contains('{value}', na=False)",
    FC_STRING_DOES_NOT_CONTAIN: "~{df_name}[{transpiled_column_header}].str.contains('{value}', na=False)",
    FC_STRING_EXACTLY: "{df_name}[{transpiled_column_header}] == '{value}'",
    FC_STRING_NOT_EXACTLY: "{df_name}[{transpiled_column_header}] != '{value}'",
    FC_STRING_STARTS_WITH: "{df_name}[{transpiled_column_header}].str.startswith('{value}', na=False)",
    FC_STRING_ENDS_WITH: "{df_name}[{transpiled_column_header}].str.endswith('{value}', na=False)",
    # DATES
    FC_DATETIME_EXACTLY: "{df_name}[{transpiled_column_header}] == pd.to_datetime('{value}')",
    FC_DATETIME_NOT_EXACTLY: "{df_name}[{transpiled_column_header}] != pd.to_datetime('{value}')",
    FC_DATETIME_GREATER: "{df_name}[{transpiled_column_header}] > pd.to_datetime('{value}')",
    FC_DATETIME_GREATER_THAN_OR_EQUAL: "{df_name}[{transpiled_column_header}] >= pd.to_datetime('{value}')",
    FC_DATETIME_LESS: "{df_name}[{transpiled_column_header}] < pd.to_datetime('{value}')",
    FC_DATETIME_LESS_THAN_OR_EQUAL: "{df_name}[{transpiled_column_header}] <= pd.to_datetime('{value}')",
}

# Dict used when there a specific filter condition has multiple
# filters that use it. Helps us write cleaner filter code!
FILTER_FORMAT_STRING_MULTIPLE_VALUES_DICT = {
    FC_EMPTY: {
        "Or": "{df_name}[{transpiled_column_header}].isna()",
        "And": "{df_name}[{transpiled_column_header}].isna()",
    },
    FC_NOT_EMPTY: {
        "Or": "{df_name}[{transpiled_column_header}].notnull()",
        "And": "{df_name}[{transpiled_column_header}].notnull()",
    },
    FC_BOOLEAN_IS_TRUE: {
        "Or": "{df_name}[{transpiled_column_header}] == True",
        "And": "{df_name}[{transpiled_column_header}] == True",
    },
    FC_BOOLEAN_IS_FALSE: {
        "Or": "{df_name}[{transpiled_column_header}] == False",
        "And": "{df_name}[{transpiled_column_header}] == False",
    },
    FC_NUMBER_EXACTLY: {
        "Or": "{df_name}[{transpiled_column_header}].isin({values})",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val == n for n in {values}))",
    },
    FC_NUMBER_NOT_EXACTLY: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val != n for n in {values}))",
        "And": "~{df_name}[{transpiled_column_header}].isin({values})",
    },
    FC_NUMBER_GREATER: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val > n for n in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val > n for n in {values}))",
    },
    FC_NUMBER_GREATER_THAN_OR_EQUAL: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val >= n for n in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val >= n for n in {values}))",
    },
    FC_NUMBER_LESS: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val < n for n in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val < n for n in {values}))",
    },
    FC_NUMBER_LESS_THAN_OR_EQUAL: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val <= n for n in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val <= n for n in {values}))",
    },
    FC_STRING_CONTAINS: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(s in str(val) for s in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(s in str(val) for s in {values}))",
    },
    FC_STRING_DOES_NOT_CONTAIN: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(s not in str(val) for s in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(s not in str(val) for s in {values}))",
    },
    FC_STRING_EXACTLY: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val == s for s in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val == s for s in {values}))",
    },
    FC_STRING_NOT_EXACTLY: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val != s for s in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val != s for s in {values}))",
    },
    FC_STRING_STARTS_WITH: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(str(val).startswith(s) for s in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(str(val).startswith(s) for s in {values}))",
    },
    FC_STRING_ENDS_WITH: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(str(val).endswith(s) for s in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(str(val).endswith(s) for s in {values}))",
    },
    FC_DATETIME_EXACTLY: {
        "Or": "{df_name}[{transpiled_column_header}].isin({values})",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val == d for d in {values}))",
    },
    FC_DATETIME_NOT_EXACTLY: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val != d for d in {values}))",
        "And": "~{df_name}[{transpiled_column_header}].isin({values})",
    },
    FC_DATETIME_GREATER: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val > d for d in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val > d for d in {values}))",
    },
    FC_DATETIME_GREATER_THAN_OR_EQUAL: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val >= d for d in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val >= d for d in {values}))",
    },
    FC_DATETIME_LESS: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val < d for d in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val < d for d in {values}))",
    },
    FC_DATETIME_LESS_THAN_OR_EQUAL: {
        "Or": "{df_name}[{transpiled_column_header}].apply(lambda val: any(val <= d for d in {values}))",
        "And": "{df_name}[{transpiled_column_header}].apply(lambda val: all(val <= d for d in {values}))",
    },
}

# If there are multiple conditions, we combine them together, with the
# given operator in the middle
OPERATOR_SIGNS = {"Or": "|", "And": "&"}


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
    def step_display_name(cls) -> str:
        return "Filtered a Column"

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
    def execute(  # type: ignore
        cls,
        prev_state: State,
        sheet_index: int,
        column_id: ColumnID,
        operator: str,
        filters,
        **params,
    ) -> Tuple[State, Optional[Dict[str, Any]]]:

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
    def transpile(  # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        sheet_index: int,
        column_id: ColumnID,
        operator: str,
        filters,
        **params,
    ) -> List[str]:
        df_name = post_state.df_names[sheet_index]
        column_header = post_state.column_ids.get_column_header_by_id(
            sheet_index, column_id
        )
        column_dtype = str(post_state.dfs[sheet_index][column_header].dtype)

        filters_only = [
            filter_or_group
            for filter_or_group in filters
            if "filters" not in filter_or_group
        ]
        filter_groups = [
            filter_or_group
            for filter_or_group in filters
            if "filters" in filter_or_group
        ]

        filter_strings = []

        # We loop over the filter conditions so we avoid looping over the filters and having to ensure
        # we don't see a filter condition twice
        for filter_condition in FILTER_FORMAT_STRING_DICT.keys():
            filter_string = create_filter_string_for_condition(
                filter_condition,
                filters_only,
                df_name,
                column_header,
                operator,
                column_dtype,
            )
            if filter_string != "":
                filter_strings.append(filter_string)

        for filter_group in filter_groups:
            # If it is a group, we build the code for each filter condition, and then combine them at the end
            group_filter_strings = []
            for filter_condition in FILTER_FORMAT_STRING_DICT.keys():
                filter_string = create_filter_string_for_condition(
                    filter_condition,
                    filter_group["filters"],
                    df_name,
                    column_header,
                    filter_group["operator"],
                    column_dtype,
                )
                if filter_string != "":
                    group_filter_strings.append(filter_string)

            if len(group_filter_strings) == 0:
                continue

            filter_strings.append(
                # Note: we add parens around this, so it's grouped properly
                "("
                + combine_filter_strings(filter_group["operator"], group_filter_strings)
                + ")"
            )

        if len(filter_strings) == 0:
            return []
        elif len(filter_strings) == 1:
            return [
                f"{df_name} = {df_name}[{filter_strings[0]}]",
            ]
        else:
            filter_string = combine_filter_strings(
                operator, filter_strings, split_lines=True
            )
            return [
                f"{df_name} = {df_name}[{filter_string}]",
            ]

    @classmethod
    def describe(  # type: ignore
        cls,
        sheet_index: int,
        column_id: ColumnID,
        operator: str,
        filters,
        df_names=None,
        **params,
    ) -> str:
        if df_names is not None:
            df_name = df_names[sheet_index]
            return f"Filtered {column_id} in {df_name}"
        return f"Filtered {column_id}"

    @classmethod
    def get_modified_dataframe_indexes(  # type: ignore
        cls, sheet_index: int, column_id: ColumnID, operator: str, filters, **params
    ) -> Set[int]:
        return {sheet_index}


def get_applied_filter(
    df: pd.DataFrame, column_header: ColumnHeader, filter_: Dict[str, Any]
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

    # Then bool
    if condition == FC_BOOLEAN_IS_TRUE:
        return df[column_header] == True
    elif condition == FC_BOOLEAN_IS_FALSE:
        return df[column_header] == False

    # Then string
    if condition == FC_STRING_CONTAINS:
        return df[column_header].str.contains(value, na=False)
    elif condition == FC_STRING_DOES_NOT_CONTAIN:
        return ~df[column_header].str.contains(value, na=False)
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


def combine_filters(operator: str, filters: pd.Series) -> pd.Series:
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


def _execute_filter(
    df: pd.DataFrame,
    column_header: ColumnHeader,
    operator: str,
    filters: List[Dict[str, Any]],
) -> Tuple[pd.DataFrame, float]:
    """
    Executes a filter on the given column, filtering by removing any rows who
    don't meet the condition.
    """

    applied_filters = []
    pandas_start_time = perf_counter()

    for filter_or_group in filters:

        # If it's a group, then we build the filters for the group, combine them
        # and then add that to the applied filters
        if "filters" in filter_or_group:
            group_filters = []
            for filter_ in filter_or_group["filters"]:
                group_filters.append(get_applied_filter(df, column_header, filter_))

            if len(group_filters) > 0:
                applied_filters.append(
                    combine_filters(filter_or_group["operator"], group_filters)
                )

        # Otherwise, we just get that specific filter, and append it
        else:
            applied_filters.append(
                get_applied_filter(df, column_header, filter_or_group)
            )

    
    if len(applied_filters) > 0:
        filtered_df = df[combine_filters(operator, applied_filters)]
    else:
        filtered_df = df

    pandas_processing_time = perf_counter() - pandas_start_time

    return filtered_df, pandas_processing_time


def get_single_filter_string(
    df_name: str, column_header: ColumnHeader, filter_: Dict[str, Any]
) -> str:
    """
    Transpiles a specific filter to a fitler string, to be used
    in constructing the final transpiled code
    """
    condition = filter_["condition"]
    value = filter_["value"]

    transpiled_column_header = column_header_to_transpiled_code(column_header)

    return FILTER_FORMAT_STRING_DICT[condition].format(
        df_name=df_name, transpiled_column_header=transpiled_column_header, value=value
    )


def get_multiple_filter_string(
    df_name: str,
    column_header: ColumnHeader,
    original_operator: str,
    condition: str,
    column_dtype: str,
    filters: List[Dict[str, Any]],
) -> str:
    """
    Transpiles a list of filters with the same filter condition to a filter string.
    """

    # Handle dates specially by wrapping the number in a string and adding the pd.to_datetime call
    values: Union[str, List[str]]
    if is_datetime_dtype(column_dtype):
        values = [f'\'{filter["value"]}\'' for filter in filters]
        values = (
            "pd.to_datetime(" + list_to_string_without_internal_quotes(values) + ")"
        )
    else:
        values = [filter["value"] for filter in filters]

    transpiled_column_header = column_header_to_transpiled_code(column_header)

    return FILTER_FORMAT_STRING_MULTIPLE_VALUES_DICT[condition][
        original_operator
    ].format(
        df_name=df_name,
        transpiled_column_header=transpiled_column_header,
        values=values,
    )


def combine_filter_strings(
    operator: str, filter_strings: List[str], split_lines: bool = False
) -> str:
    """
    Combines the given filter strings with the passed operator, optionally
    splitting the lines at 120 characters.

    NOTE: we choose to keep groups together for readibility, and so do not
    split the lines if we are combing a group.
    """
    if len(filter_strings) == 1:
        return filter_strings[0]
    else:
        # Put parens around them
        filter_strings = [f"({fs})" for fs in filter_strings]

        filter_string = ""
        current_line_length = 0
        for i, fs in enumerate(filter_strings):
            if i != 0:
                filter_string += f" {OPERATOR_SIGNS[operator]} "
            filter_string += fs
            # We keep track of how long the lines are, and if they go over 100 characters,
            # then we split them into a new line (not if this is the last one though)
            current_line_length += len(fs)
            if (
                split_lines
                and current_line_length > 100
                and i != len(filter_strings) - 1
            ):
                filter_string += " \\\n\t"
                current_line_length = 0

        return filter_string


def create_filter_string_for_condition(
    condition: str,
    mito_filters: List[Dict[str, Any]],
    df_name: str,
    column_header: ColumnHeader,
    operator: str,
    column_dtype: str,
) -> str:
    """
    Returns a list of all the filter clauses for a specific filter condition in the list of passed filters
    Note: We use the nomenclature "mito_filters" here so the compiler doesn't get confused when we use the filter function
    """
    filters_with_condition = list(
        filter(
            lambda mito_filter: (mito_filter["condition"] == condition), mito_filters
        )
    )

    if len(filters_with_condition) == 0:
        return ""
    elif len(filters_with_condition) == 1:
        # Use the single filter condition
        return get_single_filter_string(
            df_name, column_header, filters_with_condition[0]
        )
    elif len(filters_with_condition) > 1:
        # Use the multiple filter condition
        return get_multiple_filter_string(
            df_name,
            column_header,
            operator,
            condition,
            column_dtype,
            filters_with_condition,
        )

    return ""
