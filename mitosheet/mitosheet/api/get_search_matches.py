#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import re
import pandas as pd
from typing import Any, Dict
from mitosheet.types import StepsManagerType


def get_search_matches(params: Dict[str, Any], steps_manager: StepsManagerType) -> Any:
    """
    Finds the number of matches to a given search value in the dataframe.
    """
    sheet_index = params['sheet_index']
    search_value = params['search_value']
    df = steps_manager.dfs[sheet_index]

    # First, generate a count for each value in the dataframe:
    unique_value_counts = df.stack().value_counts()

    escaped_search_value = re.escape(search_value)

    # Use the same regex for all searching
    search_regex = re.compile(escaped_search_value, re.IGNORECASE)

    # Then, filter for the search value:
    matches = unique_value_counts.filter(regex=search_regex, axis=0)

    # Then, sum the matches:
    total_number_matches = int(matches.sum())

    # Then, add the column names to the matches:
    total_number_matches += len([col for col in df.columns if re.search(search_regex,str(col)) is not None])

    # Get the number of rows and columns so that we don't have to calculate the length in each iteration
    num_rows = len(df.index)
    num_cols = len(df.columns)

    # Find the indices of cells containing the search value
    # Only search the first 1500 rows because the editor only shows the first 1500 rows. 
    cell_matches = [{'rowIndex': i, 'colIndex': j} for i in range(min(1500, num_rows)) for j in range(num_cols) if (re.search(search_regex,str(df.iat[i, j])) is not None)]

    # Find the indices of columns containing the search value
    column_matches = [{'rowIndex': -1, 'colIndex': j} for j, column in enumerate(df.columns) if (re.search(search_regex,str(column)) is not None)]
    
    # We want the columns to come first
    all_matches = column_matches + cell_matches
    return {'total_number_matches': total_number_matches, 'matches': all_matches }