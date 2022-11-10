#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
import pandas as pd
from typing import Any, Dict, List, Optional
import plotly.express as px
import plotly.graph_objects as go
from mitosheet.step_performers.graph_steps.graph_utils import (
    get_html_and_script_from_figure,
)
from mitosheet.sheet_functions.types.utils import is_number_dtype
from mitosheet.types import ColumnHeader, ColumnID
from mitosheet.telemetry.telemetry_utils import log
from mitosheet.steps_manager import StepsManager
from mitosheet.step_performers.bulk_old_rename.deprecated_utils import deprecated
from mitosheet.step_performers.graph_steps.graph_utils import BAR, BOX, SCATTER

# Max number of unique non-number items to display in a graph.
# NOTE: make sure to change both in unison so they make sense
MAX_UNIQUE_NON_NUMBER_VALUES = 10_000


def get_column_summary_graph(params: Dict[str, Any], steps_manager: StepsManager) -> str:
    """
    Creates a column summary graph and sends it back as a PNG
    string to the frontend for display.
    """
    sheet_index = params['sheet_index']
    column_id: ColumnID = params['column_id']
    height = params['height']
    width = params['width']
    include_plotlyjs = params['include_plotlyjs']


    # Create a copy of the dataframe, just for safety.
    df: pd.DataFrame = steps_manager.dfs[sheet_index].copy()

    column_header = steps_manager.curr_step.final_defined_state.column_ids.get_column_header_by_id(sheet_index, column_id)
    fig = _get_column_summary_graph(df, column_header)
        
    # Get rid of some of the default white space
    fig.update_layout(
        margin=dict(
            l=0,
            r=0,
            t=30,
            b=30,
        )
    )

    return_object = get_html_and_script_from_figure(fig, height, width, include_plotlyjs)

    return json.dumps(return_object)

def filter_df_to_top_unique_values_in_series(
    df: pd.DataFrame,
    main_series: pd.Series,
    num_unique_values: int,
) -> pd.Series:
    """
    Helper function for filtering the dataframe down to the top most common
    num_unique_values in the main_series. Will not change the series if there are less
    values than that.

    The function filters the entire dataframe to make sure that the columns stay
    the same length (which is necessary if you want to graph them).

    It returns the filtered dataframe
    """
    if (
        len(main_series) < num_unique_values
        or main_series.nunique() < num_unique_values
    ):
        return df

    value_counts_series = main_series.value_counts()
    most_frequent_values_list = value_counts_series.head(
        n=num_unique_values
    ).index.tolist()

    return df[main_series.isin(most_frequent_values_list)]


def _get_column_summary_graph(df: pd.DataFrame, column_header: ColumnHeader) -> go.Figure:
    """
    One Axis Graphs heuristics:
    1. Number Column - we do no filtering. These graphs are pretty efficient up to 1M rows
    2. Non-number column. We filter to the top 10k values, as the graphs get pretty laggy
       beyond that
    """
    series: pd.Series = df[column_header]
    column_dtype = str(series.dtype)

    graph_title = f"{column_header} Frequencies"

    filtered = False
    if not is_number_dtype(column_dtype):
        if series.nunique() > MAX_UNIQUE_NON_NUMBER_VALUES:
            df = filter_df_to_top_unique_values_in_series(
                df, series, MAX_UNIQUE_NON_NUMBER_VALUES
            )
            # Set series as the newly filtered series
            series = df[column_header]

            filtered = True

        # Fill NaN values with 'NaN' so they are displayed in the graph.
        series = series.fillna("NaN")

    labels = {"x": ""}

    kwargs = {
        "x": series,
        "labels": labels,
        "title": graph_title,
    }

    fig = px.histogram(**kwargs)

    log(f"generate_column_summary_stat_graph", {"param_filtered": filtered})

    return fig



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
    other_axis_column_headers: Optional[List[ColumnHeader]] = None,
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