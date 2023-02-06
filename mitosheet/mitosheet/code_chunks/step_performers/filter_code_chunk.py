#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.


from copy import copy
from typing import List, Optional, Tuple, Union

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.sheet_functions.types.utils import is_datetime_dtype
from mitosheet.state import State
from mitosheet.step_performers.filter import (
    FC_BOOLEAN_IS_FALSE, FC_BOOLEAN_IS_TRUE, FC_DATETIME_EXACTLY,
    FC_DATETIME_GREATER, FC_DATETIME_GREATER_THAN_OR_EQUAL, FC_DATETIME_LESS,
    FC_DATETIME_LESS_THAN_OR_EQUAL, FC_DATETIME_NOT_EXACTLY, FC_EMPTY,
    FC_LEAST_FREQUENT, FC_MOST_FREQUENT, FC_NOT_EMPTY, FC_NUMBER_EXACTLY,
    FC_NUMBER_GREATER, FC_NUMBER_GREATER_THAN_OR_EQUAL, FC_NUMBER_HIGHEST,
    FC_NUMBER_LESS, FC_NUMBER_LESS_THAN_OR_EQUAL, FC_NUMBER_LOWEST,
    FC_NUMBER_NOT_EXACTLY, FC_STRING_CONTAINS, FC_STRING_DOES_NOT_CONTAIN,
    FC_STRING_ENDS_WITH, FC_STRING_EXACTLY, FC_STRING_NOT_EXACTLY,
    FC_STRING_STARTS_WITH)
from mitosheet.transpiler.transpile_utils import (
    column_header_to_transpiled_code, list_to_string_without_internal_quotes)
from mitosheet.types import (ColumnHeader, ColumnID, ColumnIDWithFilterGroup,
                             Filter, FilterGroup, Operator)

# Dict used when a filter condition is only used by one filter
FILTER_FORMAT_STRING_DICT = {
    # SHARED CONDITIONS
    FC_EMPTY: "{df_name}[{transpiled_column_header}].isna()",
    FC_NOT_EMPTY: "{df_name}[{transpiled_column_header}].notnull()",
    FC_LEAST_FREQUENT: "{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].value_counts().index.tolist()[-{value}:])",
    FC_MOST_FREQUENT: "{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].value_counts().index.tolist()[:{value}])",
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
    FC_NUMBER_LOWEST: '{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].nsmallest({value}, keep=\'all\'))',
    FC_NUMBER_HIGHEST: '{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].nlargest({value}, keep=\'all\'))',
    # STRINGS
    FC_STRING_CONTAINS: "{df_name}[{transpiled_column_header}].str.contains({value}, na=False, regex=False)",
    FC_STRING_DOES_NOT_CONTAIN: "~{df_name}[{transpiled_column_header}].str.contains({value}, na=False, regex=False)",
    FC_STRING_EXACTLY: "{df_name}[{transpiled_column_header}] == {value}",
    FC_STRING_NOT_EXACTLY: "{df_name}[{transpiled_column_header}] != {value}",
    FC_STRING_STARTS_WITH: "{df_name}[{transpiled_column_header}].str.startswith({value}, na=False)",
    FC_STRING_ENDS_WITH: "{df_name}[{transpiled_column_header}].str.endswith({value}, na=False)",
    # DATES
    FC_DATETIME_EXACTLY: "{df_name}[{transpiled_column_header}] == pd.to_datetime({value})",
    FC_DATETIME_NOT_EXACTLY: "{df_name}[{transpiled_column_header}] != pd.to_datetime({value})",
    FC_DATETIME_GREATER: "{df_name}[{transpiled_column_header}] > pd.to_datetime({value})",
    FC_DATETIME_GREATER_THAN_OR_EQUAL: "{df_name}[{transpiled_column_header}] >= pd.to_datetime({value})",
    FC_DATETIME_LESS: "{df_name}[{transpiled_column_header}] < pd.to_datetime({value})",
    FC_DATETIME_LESS_THAN_OR_EQUAL: "{df_name}[{transpiled_column_header}] <= pd.to_datetime({value})",
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
    FC_LEAST_FREQUENT: {
        'Or': "{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].value_counts().index.tolist()[-max({values}):])",
        'And': "{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].value_counts().index.tolist()[-min({values}):])",
    },
    FC_MOST_FREQUENT: {
        'Or': "{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].value_counts().index.tolist()[:max({values})])",
        'And': "{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].value_counts().index.tolist()[:min({values})])"
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
    FC_NUMBER_LOWEST: {
        "Or": '{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].nsmallest(max({values}), keep=\'all\'))',
        "And": '{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].nsmallest(min({values}), keep=\'all\'))'
    }, 
    FC_NUMBER_HIGHEST: {
        "Or": '{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].nlargest(max({values}), keep=\'all\'))',
        "And": '{df_name}[{transpiled_column_header}].isin({df_name}[{transpiled_column_header}].nlargest(min({values}), keep=\'all\'))'
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

def get_single_filter_string(
    df_name: str, column_header: ColumnHeader, filter_: Filter
) -> str:
    """
    Transpiles a specific filter to a fitler string, to be used
    in constructing the final transpiled code
    """
    condition = filter_["condition"]
    value = filter_["value"]

    transpiled_column_header = column_header_to_transpiled_code(column_header)
    value = column_header_to_transpiled_code(value)

    return FILTER_FORMAT_STRING_DICT[condition].format(
        df_name=df_name, transpiled_column_header=transpiled_column_header, value=value
    )


def get_multiple_filter_string(
    df_name: str,
    column_header: ColumnHeader,
    original_operator: Operator,
    condition: str,
    column_dtype: str,
    filters: List[Filter],
) -> str:
    """
    Transpiles a list of filters with the same filter condition to a filter string.
    """

    # Handle dates specially by wrapping the number in a string and adding the pd.to_datetime call
    values: Union[str, List[Union[str, int, float]]]
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
    operator: Operator, filter_strings: List[str], split_lines: bool = False
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
    mito_filters: List[Filter],
    df_name: str,
    column_header: ColumnHeader,
    operator: Operator,
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

FAKE_COLUMN_HEADER = 'FAKE_COLUMN_HEADER'

def get_entire_filter_string_for_filters_only(df_name: str, column_header: ColumnHeader, column_dtype: str, operator: Operator, filters_only: List[Filter]) -> Optional[str]:

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

        if len(filter_strings) == 0:
            return None
        elif len(filter_strings) == 1:
            return filter_strings[0]
        else:
            filter_string = combine_filter_strings(
                operator, filter_strings, split_lines=True
            )
            return filter_string


def get_entire_filter_string(state: State, sheet_index: int, operator: Operator, filters: List[Union[Filter, FilterGroup]], column_id: Optional[ColumnID]=None) -> Optional[str]:

        df_name = state.df_names[sheet_index]
        if column_id:
            column_header = state.column_ids.get_column_header_by_id(
                sheet_index, column_id
            )
            column_dtype = str(state.dfs[sheet_index][column_header].dtype)
        else:
            # If this filter string is for no particular column header, we use a fake column header, 
            # which allows us to change the resulting filter string to filter things other than
            # the dataframe (e.g. we want to filter a series in the conditional format). This is 
            # a somewhat ugly hack for now
            column_header = FAKE_COLUMN_HEADER
            column_dtype = 'string'

        filters_only: List[Filter] = [filter_or_group for filter_or_group in filters if "filters" not in filter_or_group] # type: ignore
        filter_groups: List[FilterGroup] = [filter_or_group for filter_or_group in filters if "filters" in filter_or_group] # type: ignore

        # Get all the filter strings
        filter_strings_with_nones = [
            get_entire_filter_string_for_filters_only(df_name, column_header, column_dtype, operator, filters_only)
        ] + [
            # NOTE: when we get to a filter group, we recurse on this function. This allows us to call this function with infinitely
            # nested filter groups, which is useful when combining code chunks
            get_entire_filter_string(state, sheet_index, filter_group["operator"], filter_group["filters"], column_id=column_id)
            for filter_group in filter_groups
        ]

        # Then, filter out all the None values
        filter_strings = [fs for fs in filter_strings_with_nones if fs is not None]

        if len(filter_strings) == 0:
            return None
        elif len(filter_strings) == 1:
            return filter_strings[0]
        else:
            filter_string = combine_filter_strings(
                operator, filter_strings, split_lines=True
            )
            return filter_string


class FilterCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, column_ids_with_filter_groups: List[ColumnIDWithFilterGroup]):
        super().__init__(prev_state, post_state)
        self.sheet_index: int = sheet_index
        self.column_ids_with_filter_groups = column_ids_with_filter_groups

        self.df_name = self.post_state.df_names[self.sheet_index]


    def get_display_name(self) -> str:
        return 'Filtered'
    
    def get_description_comment(self) -> str:
        column_ids = [f['column_id'] for f in self.column_ids_with_filter_groups]
        column_headers = self.post_state.column_ids.get_column_headers_by_ids(self.sheet_index, column_ids)
        return f'Filtered {", ".join(map(str, column_headers))}'

    def get_code(self) -> Tuple[List[str], List[str]]:
        all_filter_strings_with_none = [
            get_entire_filter_string(self.post_state, self.sheet_index, f['filter']["operator"], f['filter']["filters"], f['column_id'])
            for f in self.column_ids_with_filter_groups
        ]
        all_filter_strings = [fs for fs in all_filter_strings_with_none if fs is not None]

        if len(all_filter_strings) == 0:
            return [], []
        else:
            entire_filter_string = combine_filter_strings('And', all_filter_strings, split_lines=True)
            return [
                f"{self.df_name} = {self.df_name}[{entire_filter_string}]",
            ], []

    def _combine_right_with_filter_code_chunk(self, filter_code_chunk: "FilterCodeChunk") -> Optional['CodeChunk']:
        if not self.params_match(filter_code_chunk, ['sheet_index']):
            return None

        column_ids_with_filter_groups = copy(self.column_ids_with_filter_groups)
        column_ids_with_filter_groups.extend(filter_code_chunk.column_ids_with_filter_groups)

        return FilterCodeChunk(
            self.prev_state,
            filter_code_chunk.post_state,
            self.sheet_index,
            column_ids_with_filter_groups
        )

    def combine_right(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        if isinstance(other_code_chunk, FilterCodeChunk):
            return self._combine_right_with_filter_code_chunk(other_code_chunk)

        return None

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]
