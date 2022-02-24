#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List
import pandas as pd
from mitosheet.api.graph.get_column_summary_graph import MAX_UNIQUE_NON_NUMBER_VALUES, filter_df_to_top_unique_values_in_series
from mitosheet.sheet_functions.types.utils import is_number_dtype
from mitosheet.step_performers.bulk_old_rename.deprecated_utils import deprecated
from mitosheet.step_performers.graph.graph_utils import BAR, BOX, SCATTER
from mitosheet.types import ColumnHeader

"""
PRESERVED FOR BACKWARDS COMPATABILITY. 
This function is exported to users in the generated code. We will preserve it here so that 
the generated code of our users still executes without error. 

We also preserve the constants that the function utilizes.
"""

SCATTER_PLOT_LESS_THAN_4_SERIES_MAX_NUMBER_OF_ROWS = 10_000
SCATTER_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS = 5_000
BAR_CHART_MAX_NUMBER_OF_ROWS = 5_000
BOX_PLOT_3_SERIES_MAX_NUMBER_OF_ROWS = 500_000
BOX_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS = 250_000


def filter_df_to_safe_size(
    graph_type: str,
    df: pd.DataFrame,
    column_headers: List[ColumnHeader],
    other_axis_column_headers: List[ColumnHeader] = None,
) -> pd.DataFrame:
    """
    A helper function that filters a dataframe down to a safe size
    to display in a graph, depending on the type of graph.

    This is used to stop the graph from crashing the users browser
    when it displays too much data.

    It is also exported from the mitosheet package so that it can
    be used in the code that is exported from graphs.
    """
    original_df_len = len(df)

    if graph_type == BOX:
        if len(column_headers) <= 2:
            return df, False
        elif len(column_headers) == 3:
            return (
                df.head(BOX_PLOT_3_SERIES_MAX_NUMBER_OF_ROWS),
                original_df_len > BOX_PLOT_3_SERIES_MAX_NUMBER_OF_ROWS,
            )
        else:
            return (
                df.head(BOX_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS),
                original_df_len > BOX_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS,
            )
    elif graph_type == SCATTER:
        for column_header in column_headers:
            if not is_number_dtype(str(df[column_header].dtype)):
                # For each non-number series, filter it to only contain the most common values
                df = filter_df_to_top_unique_values_in_series(
                    df,
                    df[column_header],
                    MAX_UNIQUE_NON_NUMBER_VALUES,
                )

        # Then, take the first 10k rows
        total_allowed_rows = (
            SCATTER_PLOT_LESS_THAN_4_SERIES_MAX_NUMBER_OF_ROWS
            if len(column_headers) < 4
            else SCATTER_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS
        )
        df = df.head(total_allowed_rows)

        return df, len(df) < original_df_len
    elif graph_type == BAR:
        # If both axises are supplied, then we go on to create the bar chart.
        # Start by sorting the key column in decreasing frequency so we can filter
        # dataframe according to the top BAR_CHART_MAX_NUMBER_OF_ROWS

        # TODO: this is bugged, with multi-column headers. For now, we just take
        # the max number of rows

        # Take the first BAR_CHART_MAX_NUMBER_OF_ROWS rows
        df = df.head(BAR_CHART_MAX_NUMBER_OF_ROWS)

        return df, len(df) < original_df_len


filter_df_to_safe_size_external = deprecated(filter_df_to_safe_size)
