import json
from typing import Any, Dict, List

import pandas as pd
from mitosheet.types import ColumnHeader
import plotly.express as px
import plotly.graph_objects as go
from mitosheet.api.graph.bar import get_bar_chart, get_bar_code
from mitosheet.api.graph.box import get_box_code, get_box_plot
from mitosheet.api.graph.graph_utils import (
    BAR, BOX, HISTOGRAM, MAX_UNIQUE_NON_NUMBER_VALUES,
    MAX_UNIQUE_NON_NUMBER_VALUES_COMMENT, SCATTER, SUMMARY_STAT, X, Y,
    filter_df_to_top_unique_values_in_series, get_html_and_script_from_figure)
from mitosheet.api.graph.histogram import get_histogram, get_histogram_code
from mitosheet.api.graph.scatter import get_scatter_code, get_scatter_plot
from mitosheet.errors import get_recent_traceback
from mitosheet.mito_analytics import log, log_recent_error
from mitosheet.sheet_functions.types.utils import NUMBER_SERIES, get_mito_type
from mitosheet.steps_manager import StepsManager


def get_column_summary_graph(axis: str, df: pd.DataFrame, axis_data_array: List[ColumnHeader]) -> go.Figure:
    """
    One Axis Graphs heuristics:
    1. Number Column - we do no filtering. These graphs are pretty efficient up to 1M rows
    2. Non-number column. We filter to the top 10k values, as the graphs get pretty laggy 
       beyond that
    """
    column_header = axis_data_array[0]
    series: pd.Series = df[column_header]
    mito_type = get_mito_type(series)

    graph_title = f'{column_header} Frequencies'

    filtered = False
    if mito_type != NUMBER_SERIES:
        if series.nunique() > MAX_UNIQUE_NON_NUMBER_VALUES:
            title = f'{graph_title} {MAX_UNIQUE_NON_NUMBER_VALUES_COMMENT}'
            df = filter_df_to_top_unique_values_in_series(
                df, 
                series, 
                MAX_UNIQUE_NON_NUMBER_VALUES
            )
            # Set series as the newly filtered series
            series = df[column_header]

            filtered = True

        # Fill NaN values with 'NaN' so they are displayed in the graph.
        series = series.fillna('NaN')
            
    labels = {axis: ''}

    kwargs = {
        axis: series,
        'labels': labels,
        'title': graph_title,
    }

    fig = px.histogram(
        **kwargs        
    )

    log(f'generate_column_summary_stat_graph', {
        f'param_is_number_series_{axis}': mito_type == NUMBER_SERIES,
        'param_filtered': filtered
    })

    return fig

def get_graph(event: Dict[str, Any], steps_manager: StepsManager) -> str:
    """
    Creates a graph of the passed parameters, and sends it back as a PNG
    string to the frontend for display.

    Params:
    - graph_type
    - sheet_index
    - x_axis_column_header_array (optional)
    - y_axis_column_header_array (optional)
    - height (optional) - int representing the div width
    - width (optional) - int representing the div width

    If only an x axis is given, and if the series is a numeric series,
    will return a histogram. Otherwise, as long as there are less than 
    20 distinct items in the series, will return a bar chart of the 
    value count. Otherwise, will return nothing.
    """
    keys = event.keys()

    # Get graph type 
    graph_type = event['graph_type'] if 'graph_type' in keys else None
    sheet_index = event["sheet_index"] if "sheet_index" in keys else None

    # Get the x axis params, if they were provided
    x_axis_column_ids = event['x_axis_column_ids'] if event['x_axis_column_ids'] is not None else []
    x_axis_column_headers = steps_manager.curr_step.get_column_headers_by_ids(sheet_index, x_axis_column_ids)
    x_axis = len(x_axis_column_headers) > 0

    # Get the y axis params, if they were provided
    y_axis_column_ids = event['y_axis_column_ids'] if event['y_axis_column_ids'] is not None else []
    y_axis_column_headers = steps_manager.curr_step.get_column_headers_by_ids(sheet_index, y_axis_column_ids)
    y_axis = len(y_axis_column_headers) > 0
    
    # Find the height and the width, defaulting to fill whatever container its in
    height = event["height"] if 'height' in keys else '100%'
    width = event["width"] if 'width' in keys else '100%'

    try:
        # First, handle edge cases
        if not x_axis and not y_axis:
            # If no axes provided, return
            return ''
        if sheet_index is None or graph_type is None:
            # If no sheet_index or graph type is provided, return
            return ''
        if x_axis and len(x_axis_column_headers) > 1 and y_axis and len(y_axis_column_headers) > 1:
            # If both axises have more than 1 series, return
            return ''

        # Create a copy of the dataframe, just for safety.
        df: pd.DataFrame = steps_manager.dfs[sheet_index].copy()
        df_name: str = steps_manager.curr_step.df_names[sheet_index]

        # Handle the graphs in alphabetical order
        if graph_type == BAR:
            fig = get_bar_chart(df, x_axis_column_headers, y_axis_column_headers)
            generation_code = get_bar_code(df, x_axis_column_headers, y_axis_column_headers, df_name)
        elif graph_type == BOX:
            # Box plots are only defined on one axis. The UI should enforce that 
            # it is never the case that a box plot is selected with series for both 
            # the x and y axis. However, if it does happen, we default to taking the x axis. 
            if x_axis:
                fig = get_box_plot(X, df, x_axis_column_headers)
                generation_code = get_box_code(X, df, x_axis_column_headers, df_name)
            else:
                fig = get_box_plot(Y, df, y_axis_column_headers)
                generation_code = get_box_code(Y, df, y_axis_column_headers, df_name)
        elif graph_type == HISTOGRAM:
            # Histograms are only defined on one axis. The UI should enforce that 
            # it is never the case that a histogram is selected with series for both 
            # the x and y axis. However, if it does happen, we default to taking the x axis. 
            if x_axis:
                fig = get_histogram(X, df, x_axis_column_headers)
                generation_code = get_histogram_code(X, df, x_axis_column_headers, df_name)
            else:
                fig = get_histogram(Y, df, y_axis_column_headers)
                generation_code = get_histogram_code(Y, df, y_axis_column_headers, df_name)
        elif graph_type == SCATTER:
            fig = get_scatter_plot(df, x_axis_column_headers, y_axis_column_headers)
            generation_code = get_scatter_code(df, x_axis_column_headers, y_axis_column_headers, df_name)
        elif graph_type == SUMMARY_STAT:
            # We handle summary stats separately from the histogram, for now, because 
            # we only let the user use a histogram with all numeric data, whereas the column
            # summary stats may not be all numeric data. 
            fig = get_column_summary_graph(X, df, x_axis_column_headers)
            generation_code = ''
            
        # 1) Get rid of some of the default white space
        # 2) Add a range slider
        # 3) Set the colors of the graphs so they stand out more
        fig.update_layout(
            margin=dict(
                l=0,
                r=0,
                t=30, 
                b=30,
            ),
            xaxis=dict(
                rangeslider=dict(
                    visible=True
                ),
            ),
        )

        # Make the rangeslider take up 5% of the height of the plot space
        fig.update_xaxes(
            rangeslider_thickness = 0.05
        )

        return_object = get_html_and_script_from_figure(
            fig, height, width
        )

        return_object['generation_code'] = generation_code

        return json.dumps(return_object)

    except Exception as e:
        print(get_recent_traceback())
        log_recent_error('graph_generation_errored')
        # As not being able to make a graph is a non-critical error that doesn't
        # result from user interaction, we don't want to throw an error if something
        # weird happens, so we just return nothing in this case
        return ''
