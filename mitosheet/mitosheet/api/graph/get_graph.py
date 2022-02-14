import json
import pandas as pd
from typing import Any, Dict, List
from mitosheet.api.graph.column_summary_graph import get_column_summary_graph
from mitosheet.types import ColumnHeader
import plotly.express as px
import plotly.graph_objects as go
from mitosheet.api.graph.plotly_express_graphs import get_plotly_express_graph, get_plotly_express_graph_code
from mitosheet.api.graph.graph_utils import (SUMMARY_STAT, get_html_and_script_from_figure)
from mitosheet.errors import get_recent_traceback
from mitosheet.mito_analytics import log_recent_error
from mitosheet.steps_manager import StepsManager


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
        if graph_type == SUMMARY_STAT:
            # We handle summary stats separately from the histogram, for now, because 
            # we only let the user use a histogram with all numeric data, whereas the column
            # summary stats may not be all numeric data. 
            fig = get_column_summary_graph(df, x_axis_column_headers)
            generation_code = ''
        else:
            fig = get_plotly_express_graph(graph_type, df, x_axis_column_headers, y_axis_column_headers)
            generation_code = get_plotly_express_graph_code(graph_type, df, df_name, x_axis_column_headers, y_axis_column_headers)

            
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
