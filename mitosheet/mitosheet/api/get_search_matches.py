#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
from typing import Any, Dict, List, Tuple
from mitosheet.types import StepsManagerType
import numpy as np
import pandas as pd


def get_search_header_indexes(df: pd.DataFrame, search_string: str) -> List[Tuple[int, int]]:
    search_string = search_string.lower()
    return [
        (-1, index) for index, column_header in enumerate(df.columns) 
        if search_string in str(column_header).lower()
    ]

def get_search_cell_indexes(df: pd.DataFrame, search_string: str) -> List[Tuple[int, int]]:
    search_string = search_string.lower()

    cell_indexes = []
    for column_index, column in enumerate(df.columns):
        # If there is no data, there are no matches
        if len(df[column]) == 0:
            return []
        new_df = df[df[column].apply(str).str.lower().str.contains(search_string)]
        cell_indexes.extend([
            (row_index, column_index) for row_index in new_df.index.to_list()
        ])
    return cell_indexes


def get_search_matches(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    """
    Returns the cell indexes of the cells / headers that match the passed
    search string, only searching at most 2k cells at once. Use pagination 
    to set the starting_row_index if you want to search more.

    Params:
    -   sheet_index: number - the sheet to search
    -   search_string: string - the string to search for
    -   starting_row_index: number - where to actually start the search from, as
        this only searches 2k columns at once
    """
    sheet_index = params['sheet_index']
    search_string = params['search_string']
    starting_row_index = params['starting_row_index']

    df: pd.DataFrame = steps_manager.dfs[sheet_index]
    df = df.iloc[starting_row_index:].head(n=2000) # Take only 2k rows from the starting location
    # Reindex, so that the indexes in the dataframe correspond to frontend locations
    df.index = np.arange(starting_row_index, len(df) + starting_row_index) 

    header_indexes = get_search_header_indexes(df, search_string)
    cell_indexes = get_search_cell_indexes(df, search_string)

    return json.dumps({
        "columnHeaderIndexes": [{
            "rowIndex": row_index,
            "columnIndex": column_index
        } for (row_index, column_index) in header_indexes],
        "cellIndexes": [{
            "rowIndex": row_index,
            "columnIndex": column_index
        } for (row_index, column_index) in cell_indexes],
    })