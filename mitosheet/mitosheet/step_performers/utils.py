#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
Utilities for step performers
"""

from typing import Any, Dict, List

import pandas as pd
from mitosheet.column_headers import try_make_new_header_valid_if_multi_index_headers

from mitosheet.types import ColumnHeader


def get_param(params: Dict[str, Any], key: str) -> Any:
    if key in params:
        return params[key]
    return None

def add_columns_to_df(df: pd.DataFrame, new_columns_df: pd.DataFrame, new_column_headers: List[ColumnHeader], column_index: int) -> pd.DataFrame:
    """
    Adds new_columns_df to df at column_index.
    """
    # Make sure the new column headers are valid before adding them to the dataframe
    df_column_headers = df.columns
    new_column_headers = [try_make_new_header_valid_if_multi_index_headers(df_column_headers, column_header) for column_header in new_column_headers]
    # Add the new columns to the end of the dataframe
    df[new_column_headers] = new_columns_df
    # Set the columns in the correct order
    df = df[df.columns[:column_index + 1].tolist() + new_column_headers + df.columns[column_index + 1:-len(new_column_headers)].tolist()]
    return df