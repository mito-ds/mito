#!/usr/bin/env python
# coding: utf-8

from distutils.version import LooseVersion
import warnings
# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from time import perf_counter
from typing import Any, Callable, Collection, Dict, List, Optional, Set, Tuple

import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.pivot_code_chunk import (
    USE_INPLACE_PIVOT, PivotCodeChunk)
from mitosheet.errors import make_invalid_pivot_error, make_invalid_pivot_filter_error, make_no_column_error
from mitosheet.state import DATAFRAME_SOURCE_PIVOTED, State
from mitosheet.step_performers.filter import (combine_filters,
                                              get_applied_filter)
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.telemetry.telemetry_utils import log
from mitosheet.types import (ColumnHeader, ColumnHeaderWithFilter,
                             ColumnHeaderWithPivotTransform, ColumnID,
                             ColumnIDWithFilter, ColumnIDWithPivotTransform)
from mitosheet.array_utils import deduplicate_array
from mitosheet.utils import is_prev_version



# Aggregation types pivot supports
PA_COUNT_UNIQUE = 'count unique'
PIVOT_AGGREGATION_TYPES = [
    # These first few are supported out of the box by 
    # pandas, so we don't need any extra support for them
    'sum',
    'mean',
    'median',
    'min',
    'max', 
    'count', 
    'std',
    PA_COUNT_UNIQUE
]

# Pivot Column Transformations: if the user does not specify a transformation before the pivot (e.g. 
# getting the months from a date), then we call this a no-op
PCT_NO_OP = 'no-op'
PCT_DATE_YEAR = 'year'
PCT_DATE_QUARTER = 'quarter'
PCT_DATE_MONTH = 'month'
PCT_DATE_WEEK = 'week'
PCT_DATE_DAY_OF_MONTH = 'day of month'
PCT_DATE_DAY_OF_WEEK = 'day of week'
PCT_DATE_HOUR = 'hour'
PCT_DATE_MINUTE = 'minute'
PCT_DATE_SECOND = 'second'
PCT_DATE_YEAR_MONTH_DAY_HOUR_MINUTE = 'year-month-day-hour-minute'
PCT_DATE_YEAR_MONTH_DAY_HOUR = 'year-month-day-hour'
PCT_DATE_YEAR_MONTH_DAY = 'year-month-day'
PCT_DATE_YEAR_MONTH = 'year-month'
PCT_DATE_YEAR_QUARTER = 'year-quarter'
PCT_DATE_MONTH_DAY = 'month-day'
PCT_DATE_DAY_HOUR = 'day-hour'
PCT_DATE_HOUR_MINUTE = 'hour-minute'


class PivotStepPerformer(StepPerformer):
    """
    A pivot, which allows you to pivot data from an existing dataframe 
    along some keys, and then aggregate columns with specific functions.
    """

    @classmethod
    def step_version(cls) -> int:
        return 9

    @classmethod
    def step_type(cls) -> str:
        return 'pivot'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        We filter out any duplicated aggregation keys, as they
        result in errors without adding any data to the pivot.
        """
        # Filter out any duplicate aggregation functions
        for column_id, aggregation_function_names in params['values_column_ids_map'].items():
            new_aggregation_function_names = []
            for i in aggregation_function_names:
                if i not in new_aggregation_function_names:
                    new_aggregation_function_names.append(i)
            params['values_column_ids_map'][column_id] = new_aggregation_function_names

        return params
    

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')
        destination_sheet_index: Optional[int] = get_param(params, 'destination_sheet_index')
        
        final_destination_sheet_index = destination_sheet_index if destination_sheet_index is not None else len(prev_state.dfs)

        new_df_name = get_new_pivot_df_name(prev_state, sheet_index) if destination_sheet_index is None else prev_state.df_names[destination_sheet_index]

        execution_data = {
            # NOTE: we return the final destination name so frontend pivots can match on this execution data - it's not
            # actually used by the backend (which is kinda confusing and should be renamed)
            'destination_sheet_index': final_destination_sheet_index,
            'new_df_name': new_df_name,
        }

        try:
            return cls.execute_through_transpile(
                prev_state, 
                params, 
                execution_data,
                new_dataframe_params={
                    'df_source': DATAFRAME_SOURCE_PIVOTED,
                    'new_df_names': [new_df_name],
                    'sheet_index_to_overwrite': destination_sheet_index
                },
                use_deprecated_id_algorithm=get_param(params, 'use_deprecated_id_algorithm')
            )
        except KeyError as e:
            column_header = e.args[0]
            raise make_no_column_error([column_header], error_modal=False)


    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            PivotCodeChunk(
                prev_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'destination_sheet_index'),
                get_param(params, 'pivot_rows_column_ids_with_transforms'),
                get_param(params, 'pivot_columns_column_ids_with_transforms'),
                get_param(params, 'pivot_filters'),
                get_param(params, 'values_column_ids_map'),
                get_param(params, 'flatten_column_headers'),
                get_param(params, 'public_interface_version'),
                get_param(execution_data if execution_data is not None else {}, 'new_df_name'),
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        destination_sheet_index = get_param(params, 'destination_sheet_index')
        if destination_sheet_index: # If editing an existing sheet, that is what is changed
            return {destination_sheet_index}
        return {-1}
    

def get_new_pivot_df_name(prev_state: State, sheet_index: int) -> str: 
    """
    Creates the name for the new pivot table sheet using the format
    {source_sheet_name}_{pivot} or {source_sheet_name}_{pivot}_1, etc. 
    if the pivot table name already exists. 
    """
    new_df_name_original = prev_state.df_names[sheet_index] + '_pivot'
    curr_df_name = new_df_name_original
    multiple_sheet_indicator = 1
    while curr_df_name in prev_state.df_names:
        curr_df_name = f'{new_df_name_original}_{multiple_sheet_indicator}'
        multiple_sheet_indicator += 1
    return curr_df_name