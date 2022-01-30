import io
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import plotly.graph_objects as go
from mitosheet.sheet_functions.types.utils import NUMBER_SERIES, get_mito_type
from mitosheet.types import ColumnHeader

# We have a variety of heuristics to make sure that we never send too much data
# to the frontend to display to the user. See comments below in the file for 
# which heuristics we use. They use the following constants 

# Graph types should be kept consistent with the GraphType in GraphSidebar.tsx
SCATTER = 'scatter'
BAR = 'bar'
HISTOGRAM = 'histogram'
BOX = 'box'
SUMMARY_STAT = 'summary_stat'

# Max number of unique non-number items to display in a graph.
# NOTE: make sure to change both in unison so they make sense
MAX_UNIQUE_NON_NUMBER_VALUES = 10_000
MAX_UNIQUE_NON_NUMBER_VALUES_COMMENT = '(Top 10k)'

SCATTER_PLOT_LESS_THAN_4_SERIES_MAX_NUMBER_OF_ROWS = 10_000
SCATTER_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS = 5_000
BAR_CHART_MAX_NUMBER_OF_ROWS = 5_000
BOX_PLOT_3_SERIES_MAX_NUMBER_OF_ROWS = 500_000
BOX_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS = 250_000

# On the key axis, the difference between the minimum value and the maximum
# value initially displayed on the graph can be no larger than STARTING_RANGE_RANGE
# for qualifying graphs. Only scatter plots and bar charts with a key series that is 
# a number have the default starting range updated. 
STARTING_RANGE_MAX_RANGE = 500

# Labels used to show that the graph is filtered. 
# Used both in the graph_title and the title.
# NOTE: Because box plot filtering is more complicated, we don't 
# have a graph_filter_label for it.
GRAPH_FILTER_LABELS = {
    SCATTER: '(first 10k)',
    BAR: '(first 5k)',
    HISTOGRAM: '(all data)'
}

# Label for each type of graph used in the graph title
GRAPH_TITLE_LABELS = {
    SCATTER: 'scatter plot',
    BAR: 'bar chart',
    BOX: 'box plot',
    HISTOGRAM: 'histogram'
}

# Some nice constants
X = 'x'
Y = 'y'

CREATE_FIG_CODE = """# Import plotly and create a figure
import plotly.graph_objects as go
fig = go.Figure()
"""

# We just use fig.show(renderer="iframe"), which per testing works in both JLab 2
# and JLab 3, and renders in line.
SHOW_FIG_CODE = 'fig.show(renderer="iframe")'

def is_all_number_series(df: pd.DataFrame, column_headers: List[ColumnHeader]) -> bool:
    """
    Returns True if the Mito type of each series with the header column_header
    in column_headers is a NUMBER_SERIES. Returns False otherwise. 
    """
    for column_header in column_headers:
        mito_type = get_mito_type(df[column_header])
        if mito_type != NUMBER_SERIES:
            return False
    return True

def get_graph_title(x_axis_column_headers: List[ColumnHeader], y_axis_column_headers: List[ColumnHeader], filtered: bool, graph_type: str, special_title: str=None) -> str:
    """
    Helper function for determing the title of the graph for the scatter plot and bar chart
    """
    # Get the label to let the user know that their graph had a filter applied.

    # Handle the special case for the box plot.
    graph_filter_label: Optional[str]
    if graph_type == BOX and filtered:
        graph_filter_label = '(top 500k)' if len(x_axis_column_headers + y_axis_column_headers) == 3 else '(top 250k)'
    # Handle the special case for the scatter plot.
    elif graph_type == SCATTER and filtered:
        graph_filter_label = '(first 10k)' if len(x_axis_column_headers + y_axis_column_headers) < 4 else '(first 5k)'
    else:
        graph_filter_label = GRAPH_FILTER_LABELS[graph_type] if filtered else None

    # Compile all of the column headers into one comma separated string
    all_column_headers = (', ').join(str(s) for s in x_axis_column_headers + y_axis_column_headers)
    # Get the title of the graph based on the type of graph
    graph_title_label = GRAPH_TITLE_LABELS[graph_type] if special_title is None else special_title
    # Combine all of the non empty graph title components into one list
    graph_title_components = [all_column_headers, graph_filter_label, graph_title_label] if graph_filter_label is not None else [all_column_headers, graph_title_label]
    
    # Return a string with all of the graph_title_components separated by a space  
    return (' ').join(graph_title_components)


def get_graph_labels(x_axis_column_headers: List[ColumnHeader], y_axis_column_headers: List[ColumnHeader]) -> Tuple[str, str]:
    """
    Helper function for determining the x and y axis titles, 
    for the scatter plot and bar chart. 
    """
    if x_axis_column_headers == [] and y_axis_column_headers == []:
        # If no data is provided, don't label the axises
        x_axis_title = ''
        y_axis_title = ''

    elif x_axis_column_headers == [] and y_axis_column_headers != []:
        # Following from the graph generation, if the user only selects a y axis, 
        # then the y axis is the index column and the columns selected are put on the x axis
        x_axis_title = str(y_axis_column_headers[0]) if len(y_axis_column_headers) == 1 else ''
        y_axis_title = 'index'

    elif x_axis_column_headers != [] and y_axis_column_headers == []:
        # Following from the graph generation, if the user only selects a x axis, 
        # then the y axis is the index column
        x_axis_title = 'index'
        y_axis_title = str(x_axis_column_headers[0]) if len(x_axis_column_headers) == 1 else ''

    else: 
        # Only label the axis if there is one column header on the axis. Otherwise, plotly 
        # legend will label the columns
        x_axis_title = str(x_axis_column_headers[0]) if len(x_axis_column_headers) == 1 else ''
        y_axis_title = str(y_axis_column_headers[0]) if len(y_axis_column_headers) == 1 else ''

    return x_axis_title, y_axis_title


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
    if len(main_series) < num_unique_values or main_series.nunique() < num_unique_values:
        return df

    value_counts_series = main_series.value_counts()
    most_frequent_values_list = value_counts_series.head(n=num_unique_values).index.tolist()

    return df[main_series.isin(most_frequent_values_list)]

def filter_df_to_safe_size(
        graph_type: str, 
        df: pd.DataFrame, 
        column_headers: List[ColumnHeader],
        other_axis_column_headers: List[ColumnHeader]=None
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
            return df.head(BOX_PLOT_3_SERIES_MAX_NUMBER_OF_ROWS), original_df_len > BOX_PLOT_3_SERIES_MAX_NUMBER_OF_ROWS
        else:
            return df.head(BOX_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS), original_df_len > BOX_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS
    elif graph_type == SCATTER:
        for column_header in column_headers:
            if get_mito_type(df[column_header]) != NUMBER_SERIES:
                # For each non-number series, filter it to only contain the most common values
                df = filter_df_to_top_unique_values_in_series(
                    df, 
                    df[column_header],
                    MAX_UNIQUE_NON_NUMBER_VALUES,
                )

        # Then, take the first 10k rows
        total_allowed_rows = SCATTER_PLOT_LESS_THAN_4_SERIES_MAX_NUMBER_OF_ROWS if len(column_headers) < 4 else SCATTER_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS
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


def get_html_and_script_from_figure(fig: go.Figure, height: int, width: int) -> Dict[str, str]:
    """
    Given a plotly figure, generates HTML from it, and returns
    a dictonary with the div and script for the frontend.

    The plotly HTML generated by the write_html function call is a div with two children:
    1. a div that contains the id for the graph itself
    2. a script that actually builds the graph
    
    Because we have to dynamically execute the script, we split these into two 
    strings, to make them easier to do what we need on the frontend
    """
    # Send the graph back to the frontend
    buffer = io.StringIO()
    fig.write_html(
        buffer,
        full_html=False,
        include_plotlyjs=False,
        default_height=height,
        default_width=width,
    )
    
    original_html = buffer.getvalue()
    # First, we remove the main div, and the resulting whitespace, to just have the children
    original_html = original_html[5:]
    original_html = original_html[:-6]
    original_html = original_html.strip()

    # Then, we split the children into the div, and the script 
    # making sure to remove the script tag (so we can execute it)
    script_start = '<script type=\"text/javascript\">'
    script_end = '</script>'
    split_html = original_html.split(script_start)
    div = split_html[0]
    script = split_html[1][:-len(script_end)]

    return {
        'html': div,
        'script': script
    }
