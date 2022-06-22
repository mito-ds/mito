#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
from typing import Any, Dict, Set

import pandas as pd
from mitosheet.state import State
from mitosheet.types import ColumnID, StepsManagerType
from mitosheet.utils import get_row_data_array

# The maximum number of values the front-end sends to the backend
# See comments in function description below.
MAX_UNIQUE_VALUES = 1_000

def get_matching_values(state: State, sheet_index: int, column_id: ColumnID, search_string: str) -> Set[Any]:
    unique_value_count_df = get_unique_value_count_df(state, sheet_index, column_id, search_string)
    return set(unique_value_count_df['values'])

def get_unique_value_count_df(state: State, sheet_index: int, column_id: ColumnID, search_string: str) -> pd.DataFrame:
    column_header = state.column_ids.get_column_header_by_id(sheet_index, column_id)
    
    series: pd.Series = state.dfs[sheet_index][column_header]

    unique_value_counts_percents_series = series.value_counts(normalize=True, dropna=False)
    unique_value_counts_series = series.value_counts(dropna=False)

    filtered_out_values = state.column_filters[sheet_index][column_id]['bulk_filter']['value']

    unique_value_counts_df = pd.DataFrame({
        'values': list(filtered_out_values) + unique_value_counts_percents_series.index.to_list(),
        'percents': [0.0 for _ in range(len(filtered_out_values))] + unique_value_counts_percents_series.tolist(), 
        'counts': [0 for _ in range(len(filtered_out_values))] + unique_value_counts_series.tolist()
    })

    # Then, we filter with the string. Note that we always filter on the string representation
    # because the front-end sends a string
    unique_value_counts_df['values_strings'] = unique_value_counts_df['values'].astype('str')
    unique_value_counts_df = unique_value_counts_df[unique_value_counts_df['values_strings'].str.contains(search_string, na=False, case=False, regex=False)]

    return unique_value_counts_df


def get_unique_value_counts(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Sends back a string that can be parsed to a JSON object that
    contains the normalized value counts for the series at column_id 
    in the df at sheet_index.

    Also takes a search_string and sort string, which it uses to filter 
    down the dataset if there are more than MAX_UNIQUE_VALUES
    
    NOTE: the front-end also filters with the search string, and
    reorders with the sort; we just do it here on the backend in 
    the case that there are more than MAX_UNIQUE_VALUES so we 
    don't crash the front-end with too much data.
    """
    sheet_index = params['sheet_index']
    column_id = params['column_id']
    search_string = params['search_string']
    sort = params['sort']
    
    unique_value_counts_df = get_unique_value_count_df(steps_manager.curr_step.final_defined_state, sheet_index, column_id, search_string)

     # First, we sort in the order they want
    try:
        if sort == 'Ascending Value':
            unique_value_counts_df = unique_value_counts_df.sort_values(by='values', ascending=True, na_position='first')
        elif sort == 'Descending Value':
            unique_value_counts_df = unique_value_counts_df.sort_values(by='values', ascending=False, na_position='first')
        elif sort == 'Ascending Occurence':
            unique_value_counts_df = unique_value_counts_df.sort_values(by='counts', ascending=True, na_position='first')
        elif sort == 'Descending Occurence':
            unique_value_counts_df = unique_value_counts_df.sort_values(by='counts', ascending=False, na_position='first')
    except:
        # If the sort values throws an exception, then this must be because we have a mixed value type, and so we instead
        # sort on the string representation of the values (as this will always work)
        if sort == 'Ascending Value':
            unique_value_counts_df = unique_value_counts_df.sort_values(by='values_strings', ascending=True, na_position='first')
        elif sort == 'Descending Value':
            unique_value_counts_df = unique_value_counts_df.sort_values(by='values_strings', ascending=False, na_position='first')

    # Then, if there are too many values, we eliminate them
    if len(unique_value_counts_df) > MAX_UNIQUE_VALUES:
        unique_value_counts_df = unique_value_counts_df.head(MAX_UNIQUE_VALUES)
        is_all_data = False
    else:
        is_all_data = True

    print(get_row_data_array(unique_value_counts_df))
    
    return json.dumps({
        'uniqueValueRowDataArray': get_row_data_array(unique_value_counts_df),
        'isAllData': is_all_data
    })

