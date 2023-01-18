#!/usr/bin/env python
# coding: utf-8

import warnings
# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from time import perf_counter
from typing import Any, Callable, Collection, Dict, List, Optional, Set, Tuple

import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.pivot_code_chunk import (
    USE_INPLACE_PIVOT, PivotCodeChunk)
from mitosheet.column_headers import flatten_column_header
from mitosheet.errors import make_invalid_pivot_error, make_no_column_error
from mitosheet.state import DATAFRAME_SOURCE_PIVOTED, State
from mitosheet.step_performers.filter import (combine_filters,
                                              get_applied_filter)
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
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
        return 8

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
        pivot_rows_column_ids_with_transforms: List[ColumnIDWithPivotTransform] = get_param(params, 'pivot_rows_column_ids_with_transforms')
        pivot_columns_column_ids_with_transforms: List[ColumnIDWithPivotTransform] = get_param(params, 'pivot_columns_column_ids_with_transforms')
        values_column_ids_map: Dict[ColumnID, Collection[str]] = get_param(params, 'values_column_ids_map')
        pivot_filters_ids: List[ColumnIDWithFilter] = get_param(params, 'pivot_filters')
        flatten_column_headers: bool = get_param(params, 'flatten_column_headers')
        destination_sheet_index: Optional[int] = get_param(params, 'destination_sheet_index')
        use_deprecated_id_algorithm: bool = get_param(params, 'use_deprecated_id_algorithm') if get_param(params, 'use_deprecated_id_algorithm') else False
        
        # Get just the column headers in a list, for convenience
        pivot_rows = [prev_state.column_ids.get_column_header_by_id(sheet_index, cit['column_id']) for cit in pivot_rows_column_ids_with_transforms]
        pivot_columns = [prev_state.column_ids.get_column_header_by_id(sheet_index, cit['column_id']) for cit in pivot_columns_column_ids_with_transforms]

        # Make new objects with all columns headers
        pivot_rows_with_transforms: List[ColumnHeaderWithPivotTransform] = [{
            'column_header': prev_state.column_ids.get_column_header_by_id(sheet_index, chwpt['column_id']),
            'transformation': chwpt['transformation']
        } for chwpt in pivot_rows_column_ids_with_transforms]
        pivot_columns_with_transforms: List[ColumnHeaderWithPivotTransform] = [{
            'column_header': prev_state.column_ids.get_column_header_by_id(sheet_index, chwpt['column_id']),
            'transformation': chwpt['transformation']
        } for chwpt in pivot_columns_column_ids_with_transforms]
        values = {
            prev_state.column_ids.get_column_header_by_id(sheet_index, column_id): value 
            for column_id, value in values_column_ids_map.items()
        }
        pivot_filters: List[ColumnHeaderWithFilter] = [
            {'column_header': prev_state.column_ids.get_column_header_by_id(sheet_index, pf['column_id']), 'filter': pf['filter']}
            for pf in pivot_filters_ids
        ]

        # We check that the pivot by doesn't use any columns that don't exist
        columns_used = set(pivot_rows).union(set(pivot_columns)).union(set(values.keys()))
        missing_pivot_keys = columns_used.difference(prev_state.dfs[sheet_index].keys())
        if len(missing_pivot_keys) > 0:
            raise make_no_column_error(missing_pivot_keys)

        # Create the post state, it can be a shallow copy
        post_state = prev_state.copy()

        # Actually execute the pivoting
        pandas_start_time = perf_counter()
        new_df, was_series = _execute_pivot(
            prev_state.dfs[sheet_index], 
            pivot_rows_with_transforms,
            pivot_columns_with_transforms,
            values,
            pivot_filters,
            flatten_column_headers
        )
        pandas_processing_time = perf_counter() - pandas_start_time
        # Create a new df name if we don't have one
        df_name = get_new_pivot_df_name(post_state, sheet_index) if destination_sheet_index is None else post_state.df_names[destination_sheet_index]
        
        destination_sheet_index = post_state.add_df_to_state(
            new_df, 
            DATAFRAME_SOURCE_PIVOTED,
            sheet_index=destination_sheet_index,
            df_name=df_name,
            use_deprecated_id_algorithm=use_deprecated_id_algorithm
        )


        return post_state, {
            'destination_sheet_index': destination_sheet_index,
            'was_series': was_series,
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
        return [
            PivotCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'sheet_index'),
                get_param(params, 'destination_sheet_index'),
                get_param(params, 'pivot_rows_column_ids_with_transforms'),
                get_param(params, 'pivot_columns_column_ids_with_transforms'),
                get_param(params, 'pivot_filters'),
                get_param(params, 'values_column_ids_map'),
                get_param(params, 'flatten_column_headers'),
                get_param(execution_data if execution_data is not None else {}, 'was_series'),
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        destination_sheet_index = get_param(params, 'destination_sheet_index')
        if destination_sheet_index: # If editing an existing sheet, that is what is changed
            return {destination_sheet_index}
        return {-1}
    
def values_to_functions(values: Dict[ColumnHeader, Collection[str]]) -> Dict[ColumnHeader, List[Callable]]:
    """
    Helper function for turning the values mapping sent by the frontend to 
    the value map of functions that can actually be passed to the pandas pivot function
    """
    new_values: Dict[ColumnHeader, List[Callable]] = dict()

    for column_header, aggregation_function_names in values.items():
        new_values[column_header] = []
        for agg_func_name in aggregation_function_names:
            if agg_func_name not in PIVOT_AGGREGATION_TYPES:
                raise make_invalid_pivot_error()

            if agg_func_name == PA_COUNT_UNIQUE:
                agg_func = pd.Series.nunique
            else:
                agg_func = agg_func_name
                
            new_values[column_header].append(agg_func)
    
    return new_values


def get_new_column_header_from_column_header_with_pivot_transform(chwpt: ColumnHeaderWithPivotTransform) -> ColumnHeader:
    column_header, transformation = chwpt['column_header'], chwpt['transformation']
    # We need to turn the column header into a string before creating the new one, so that we can
    # append to it for the new temporary transformation column
    if transformation == PCT_NO_OP:
        return column_header

    return f'{str(column_header)} ({transformation})'

def add_transform_columns_to_dataframe(df: pd.DataFrame, column_headers_with_transforms: List[ColumnHeaderWithPivotTransform]) -> pd.DataFrame:
    for chwpt in column_headers_with_transforms:
        column_header, transformation = chwpt['column_header'], chwpt['transformation']
        # We need to turn the column header into a string before creating the new one, so that we can
        # append to it for the new temporary transformation column
        if transformation == PCT_NO_OP:
            continue

        new_column_header = get_new_column_header_from_column_header_with_pivot_transform(chwpt)
        if transformation == PCT_DATE_YEAR:
            df[new_column_header] = df[column_header].dt.year
        if transformation == PCT_DATE_QUARTER:
            df[new_column_header] = df[column_header].dt.quarter
        if transformation == PCT_DATE_MONTH:
            df[new_column_header] = df[column_header].dt.month
        if transformation == PCT_DATE_WEEK:
            if is_prev_version(pd.__version__, '1.0.0'):
                df[new_column_header] = df[column_header].dt.week
            else:
                df[new_column_header] = df[column_header].dt.isocalendar().week.astype(int)
        if transformation == PCT_DATE_DAY_OF_MONTH:
            df[new_column_header] = df[column_header].dt.day
        if transformation == PCT_DATE_DAY_OF_WEEK:
            df[new_column_header] = df[column_header].dt.weekday
        if transformation == PCT_DATE_HOUR:
            df[new_column_header] = df[column_header].dt.hour
        if transformation == PCT_DATE_MINUTE:
            df[new_column_header] = df[column_header].dt.minute
        if transformation == PCT_DATE_SECOND:
            df[new_column_header] = df[column_header].dt.second
        if transformation == PCT_DATE_YEAR_MONTH_DAY_HOUR_MINUTE:
            df[new_column_header] = df[column_header].dt.strftime("%Y-%m-%d %H:%M")
        if transformation == PCT_DATE_YEAR_MONTH_DAY_HOUR:
            df[new_column_header] = df[column_header].dt.strftime("%Y-%m-%d %H")
        if transformation == PCT_DATE_YEAR_MONTH_DAY:
            df[new_column_header] = df[column_header].dt.strftime("%Y-%m-%d")
        if transformation == PCT_DATE_YEAR_MONTH:
            df[new_column_header] = df[column_header].dt.strftime("%Y-%m")
        if transformation == PCT_DATE_YEAR_QUARTER:
            df[new_column_header] = df[column_header].dt.year.astype(str) + "-Q" + df[column_header].dt.quarter.astype(str)
        if transformation == PCT_DATE_MONTH_DAY:
            df[new_column_header] = df[column_header].dt.strftime("%m-%d")
        if transformation == PCT_DATE_DAY_HOUR:
            df[new_column_header] = df[column_header].dt.strftime("%d %H")
        if transformation == PCT_DATE_HOUR_MINUTE:
            df[new_column_header] = df[column_header].dt.strftime("%H:%M")

    
    return df


def _execute_pivot(
        df: pd.DataFrame, 
        pivot_rows_with_transforms: List[ColumnHeaderWithPivotTransform], 
        pivot_columns_with_transforms: List[ColumnHeaderWithPivotTransform], 
        values: Dict[ColumnHeader, Collection[str]],
        pivot_filters: List[ColumnHeaderWithFilter],
        flatten_column_headers: bool
    ) -> Tuple[pd.DataFrame, bool]:
    """
    Helper function for executing the pivot on a specific dataframe
    and then aggregating the values with the passed values mapping
    """

    pivot_rows = [cit['column_header'] for cit in pivot_rows_with_transforms]
    pivot_columns = [cit['column_header'] for cit in pivot_columns_with_transforms]

    # If there are no keys to aggregate on, we return an empty dataframe
    if (len(pivot_rows) == 0 and len(pivot_columns) == 0) or len(values) == 0:
        return pd.DataFrame(data={}), False

    values_keys = list(values.keys())

    # First, we do the filtering on the initial dataframe, according to the pivot_filters
    if len(pivot_filters) > 0:
        filters = [
            get_applied_filter(df, pf['column_header'], pf['filter'])
            for pf in pivot_filters
        ]
        full_filter = combine_filters('And', filters)
        df = df[full_filter] # TODO: do we have to make a copy

    # Then, we make a temp dataframe that does not have the columns 
    # we do not need, as this allows us to avoid a bug in pandas where these extra
    # columns cause a data
    unused_columns = df.columns.difference(set(pivot_rows).union(set(pivot_columns)).union(set(values_keys)))
    # NOTE: We need to make a copy, so that we can set columns on a full dataframe rather than
    # just a view of a different dataframe. This is just a shallow copy
    df = df.drop(unused_columns, axis=1).copy()

    # Then, we create the new columns that are a function of the transforms that are passed
    # with the pivot params
    df = add_transform_columns_to_dataframe(df, pivot_rows_with_transforms)
    df = add_transform_columns_to_dataframe(df, pivot_columns_with_transforms)

    # Create the final pivot_rows and pivot_columns, which might be the temporary columns
    # created above by the transformations. NOTE: we need to deduplicate these here, as
    # having multiple rows or columns results in errors in the pandas pivot function
    final_pivot_rows = deduplicate_array([
        get_new_column_header_from_column_header_with_pivot_transform(chwpt)
        for chwpt in pivot_rows_with_transforms
    ])
    final_pivot_columns = deduplicate_array([
        get_new_column_header_from_column_header_with_pivot_transform(chwpt)
        for chwpt in pivot_columns_with_transforms
    ])

    # Built the args, leaving out any unused values
    args: Dict[str, Any] = {}
    if len(final_pivot_rows) > 0:
        args['index'] = final_pivot_rows

    if len(final_pivot_columns) > 0:
        args['columns'] = final_pivot_columns

    if len(values) > 0:
        args['values'] = values_keys
        args['aggfunc'] = values_to_functions(values)
        

    # While performing the pivot table, catch warnings that are created
    # by pandas so that we can log them.
    with warnings.catch_warnings(record=True):
        # Forward the warning handling to our custom function to log it
        warnings.showwarning = log_pivot_table_warnings
        
        # Actually perform the pivot
        pivot_table = df.pivot_table(**args) # type: pd.DataFrame

    # On earlier pandas versions (e.g. 0.24.2), the pivot table function returned
    # a series from the above function call. Thus, we need to move it to a df for
    # all our other code run properly on it. This code should only run in early 
    # versions of pandas
    was_series = False
    if isinstance(pivot_table, pd.Series):
        pivot_table = pd.DataFrame(pivot_table)
        was_series = True

    if flatten_column_headers:
        # See comment in pivot_code_chunk, we avoid using inplace=True post pandas 1.5.0, as
        # it is depricated
        if USE_INPLACE_PIVOT:
            pivot_table.set_axis([flatten_column_header(col) for col in pivot_table.keys()], axis=1, inplace=True)
        else:
            pivot_table = pivot_table.set_axis([flatten_column_header(col) for col in pivot_table.keys()], axis=1)

    # Reset the indexes of the pivot table
    pivot_table = pivot_table.reset_index()

    return pivot_table, was_series

def get_new_pivot_df_name(post_state: State, sheet_index: int) -> str: 
    """
    Creates the name for the new pivot table sheet using the format
    {source_sheet_name}_{pivot} or {source_sheet_name}_{pivot}_1, etc. 
    if the pivot table name already exists. 
    """
    new_df_name_original = post_state.df_names[sheet_index] + '_pivot'
    curr_df_name = new_df_name_original
    multiple_sheet_indicator = 1
    while curr_df_name in post_state.df_names:
        curr_df_name = f'{new_df_name_original}_{multiple_sheet_indicator}'
        multiple_sheet_indicator += 1
    return curr_df_name


def log_pivot_table_warnings(message, *args):
    """
    Logs warnings that are created by the pandas pivot table function.
    Using warnings.showwarning passes several additional arguments to the function, 
    so we must include *args to support them.
    """
    params = {'message': str(message)}
    log('pivot_table_performance_warning', params)
