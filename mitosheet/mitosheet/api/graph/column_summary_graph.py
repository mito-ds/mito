import pandas as pd
from typing import List
from mitosheet.sheet_functions.types.utils import is_number_dtype
from mitosheet.types import ColumnHeader
import plotly.express as px
import plotly.graph_objects as go
from mitosheet.mito_analytics import log


# Max number of unique non-number items to display in a graph.
# NOTE: make sure to change both in unison so they make sense
MAX_UNIQUE_NON_NUMBER_VALUES = 10_000


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


def get_column_summary_graph(
    df: pd.DataFrame, axis_data_array: List[ColumnHeader]
) -> go.Figure:
    """
    One Axis Graphs heuristics:
    1. Number Column - we do no filtering. These graphs are pretty efficient up to 1M rows
    2. Non-number column. We filter to the top 10k values, as the graphs get pretty laggy
       beyond that
    """
    column_header = axis_data_array[0]
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
