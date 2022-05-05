#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
from typing import Any, Dict

import pandas as pd
from mitosheet.types import StepsManagerType
from mitosheet.utils import df_to_json_dumpsable

# The maximum number of values the front-end sends to the backend
# See comments in function description below.
MAX_UNIQUE_VALUES = 1_000

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

    column_header = steps_manager.curr_step.column_ids.get_column_header_by_id(sheet_index, column_id)
    
    series: pd.Series = steps_manager.dfs[sheet_index][column_header]

    unique_value_counts_percents_series = series.value_counts(normalize=True, dropna=False)
    unique_value_counts_series = series.value_counts(dropna=False)
    
    unique_value_counts_df = pd.DataFrame({
        'values': unique_value_counts_percents_series.index,
        'percents': unique_value_counts_percents_series, 
        'counts': unique_value_counts_series
    })

    if len(unique_value_counts_df) > MAX_UNIQUE_VALUES:
        # First, we turn the series into a string series, so that we can
        # easily filter on it without issues (and sort in some cases)
        new_unique_value_counts_df = unique_value_counts_df.copy(deep=True)
        new_unique_value_counts_df['values_strings'] = new_unique_value_counts_df['values'].astype('str')

        # First, we sort in the order they want
        try:
            if sort == 'Ascending Value':
                new_unique_value_counts_df = new_unique_value_counts_df.sort_values(by='values', ascending=True, na_position='first')
            elif sort == 'Descending Value':
                new_unique_value_counts_df = new_unique_value_counts_df.sort_values(by='values', ascending=False, na_position='first')
            elif sort == 'Ascending Occurence':
                new_unique_value_counts_df = new_unique_value_counts_df.sort_values(by='counts', ascending=True, na_position='first')
            elif sort == 'Descending Occurence':
                new_unique_value_counts_df = new_unique_value_counts_df.sort_values(by='counts', ascending=False, na_position='first')
        except:
            # If the sort values throws an exception, then this must be because we have a mixed value type, and so we instead
            # sort on the string representation of the values (as this will always work)
            if sort == 'Ascending Value':
                new_unique_value_counts_df = new_unique_value_counts_df.sort_values(by='values_strings', ascending=True, na_position='first')
            elif sort == 'Descending Value':
                new_unique_value_counts_df = new_unique_value_counts_df.sort_values(by='values_strings', ascending=False, na_position='first')

        # Then, we filter with the string. Note that we always filter on the string representation
        # because the front-end sends a string
        new_unique_value_counts_df = new_unique_value_counts_df[new_unique_value_counts_df['values_strings'].str.contains(search_string, na=False, case=False)]

        # Finially, we only take the first MAX_UNIQUE_VALUES
        if len(new_unique_value_counts_df) > MAX_UNIQUE_VALUES:
            new_unique_value_counts_df = new_unique_value_counts_df.head(MAX_UNIQUE_VALUES)
            is_all_data = False
        else:
            is_all_data = True

        # And then we filter the unique values down to these specific values
        unique_value_counts_df = unique_value_counts_df.loc[new_unique_value_counts_df.index]
        unique_value_counts_df.reset_index(drop=True)

    else:
        is_all_data = True
    
    return json.dumps({
        'uniqueValueCountsSheetData': df_to_json_dumpsable(
            unique_value_counts_df, 
            'value counts',
            'imported',
            {},
            {},
            {'values': 'values', 'percents': 'percents', 'counts': 'counts'},
            {},
            max_length=None
        ),
        'isAllData': is_all_data
    })

