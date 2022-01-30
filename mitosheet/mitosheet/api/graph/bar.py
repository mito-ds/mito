from typing import Any, List

import pandas as pd
import plotly.graph_objects as go
from mitosheet.api.graph.graph_utils import (BAR, CREATE_FIG_CODE,
                                             GRAPH_FILTER_LABELS,
                                             SHOW_FIG_CODE, X, Y,
                                             filter_df_to_safe_size,
                                             get_graph_labels, get_graph_title)
from mitosheet.api.graph.histogram import get_histogram, get_histogram_code
from mitosheet.mito_analytics import log
from mitosheet.sheet_functions.types.utils import get_mito_type
from mitosheet.transpiler.transpile_utils import \
    column_header_to_transpiled_code
from mitosheet.types import ColumnHeader


def get_bar_chart(df: pd.DataFrame, x_axis_column_headers: List[ColumnHeader], y_axis_column_headers: List[ColumnHeader]) -> go.Figure:
    """
    Returns a bar chart using the following heuristic:
    - Graphs the first BAR_CHART_MAX_NUMBER_OF_ROWS rows. 

    If only one axis has data, then we create a histogram instead. 

    If at leastat least the x_axis_column_headers or y_axis_column_headers 
    has at least one series, then it returns a bar chart. Otherwise, it returns 
    a blank graph.
    """
    x_axis = len(x_axis_column_headers) != 0
    y_axis = len(y_axis_column_headers) != 0
    
    # If no data is passed, return a blank graph
    if not x_axis and not y_axis:
        # This should never happen because this check already occurs in the get_graph
        # function. But we leave it here for robustness of the function
        return go.Figure()

    # If only one axis is supplied, then we create a histogram instead of a bar chart 
    # because it is more informative to show the counts of each value instead of graphing 
    # the values by index. 
    if x_axis and not y_axis:
        return get_histogram(X, df, x_axis_column_headers)
    elif y_axis and not x_axis:
        return get_histogram(Y, df, y_axis_column_headers)

    df, filtered = filter_df_to_safe_size(BAR, df, x_axis_column_headers, y_axis_column_headers)

    # Determine if the dataframe was sorted
    filter_label = GRAPH_FILTER_LABELS[BAR] if filtered else ''

    fig = go.Figure()

    # If the y_axis has __exactly__ one series and the x_axis has __at least__ one series (covered by above checks)
    if len(y_axis_column_headers) == 1:
        for column_header in x_axis_column_headers:
            fig.add_trace(
                go.Bar( 
                    x=df[column_header],
                    y=df[y_axis_column_headers[0]],
                    name=(' ').join([str(column_header), filter_label])
                )
            )
    # If the y_axis has > one series and the x_axis has __at least__ one series (covered by above checks)
    else: 
        for column_header in y_axis_column_headers:
            fig.add_trace(
                go.Bar( 
                    x=df[x_axis_column_headers[0]],
                    y=df[column_header],
                    name=(' ').join([str(column_header), filter_label])
                )
            )
        
    # Update the layout of the graph
    x_axis_title, y_axis_title = get_graph_labels(x_axis_column_headers, y_axis_column_headers)
    graph_title = get_graph_title(x_axis_column_headers, y_axis_column_headers, filtered, BAR)
    fig.update_layout(
        xaxis_title=x_axis_title,
        yaxis_title=y_axis_title,
        title=graph_title,
        barmode='group',
    )

    log(f'generate_graph', {
        'params_graph_type': BAR,
        'params_x_axis_column_headers': x_axis_column_headers,
        'params_x_axis_column_types': [get_mito_type(df[column_header]) for column_header in x_axis_column_headers] if x_axis_column_headers is not None else [],
        'params_y_axis_column_headers': y_axis_column_headers,
        'params_y_axis_column_types': [get_mito_type(df[column_header]) for column_header in y_axis_column_headers] if y_axis_column_headers is not None else [],
        'params_filtered': filtered,
    })

    return fig

def get_bar_code(
        df: pd.DataFrame, 
        x_axis_column_headers: List[ColumnHeader], 
        y_axis_column_headers: List[ColumnHeader],
        df_name: str
    ) -> str:
    """
    Generates the code for a bar graph, in the same way that the bar is
    created above (leaving out zooming).
    """

    x_axis = len(x_axis_column_headers) != 0
    y_axis = len(y_axis_column_headers) != 0

    if x_axis and not y_axis:
        return get_histogram_code(X, df, x_axis_column_headers, df_name)
    elif y_axis and not x_axis:
        return get_histogram_code(Y, df, y_axis_column_headers, df_name)

    _, filtered = filter_df_to_safe_size(BAR, df, x_axis_column_headers + y_axis_column_headers)
    filtered_code = ''
    if filtered:
        filtered_code = """
# Filter the dataframe so that it does not crash the browser
from mitosheet import filter_df_to_safe_size
{df_name}_filtered, _ = filter_df_to_safe_size('bar', {df_name}, {x_axis_column_headers}, {y_axis_column_headers})
""".format(
    df_name=df_name,
    x_axis_column_headers=x_axis_column_headers,
    y_axis_column_headers=y_axis_column_headers
)
        df_name = f'{df_name}_filtered'

    if len(y_axis_column_headers) == 1:
        transpiled_y_axis_column_header = column_header_to_transpiled_code(y_axis_column_headers[0])

        trace_code = """
# Add the bar chart traces to the graph
for column_header in {x_axis_column_headers}:
    fig.add_trace(
        go.Bar( 
            x={df_name}[column_header],
            y={df_name}[{transpiled_y_axis_column_header}],
            name=str(column_header)
        )
    )
""".format(
        x_axis_column_headers=x_axis_column_headers,
        transpiled_y_axis_column_header=transpiled_y_axis_column_header,
        df_name=df_name
    )
        
    # If the y_axis has > one series and the x_axis has __at least__ one series (covered by above checks)
    else: 
        transpiled_x_axis_column_header = column_header_to_transpiled_code(x_axis_column_headers[0])
        trace_code = """
# Add the bar chart traces to the graph
for column_header in {y_axis_column_headers}:
    fig.add_trace(
        go.Bar( 
            x={df_name}[{transpiled_x_axis_column_header}],
            y={df_name}[column_header],
            name=str(column_header)
        )
    )
""".format(
        y_axis_column_headers=y_axis_column_headers,
        transpiled_x_axis_column_header=transpiled_x_axis_column_header,
        df_name=df_name
    )

    # Update the layout of the graph
    x_axis_title, y_axis_title = get_graph_labels(x_axis_column_headers, y_axis_column_headers)
    graph_title = get_graph_title(x_axis_column_headers, y_axis_column_headers, filtered, BAR)

    return """{CREATE_FIG_CODE}
{filtered_code}
{trace_code}
# Update the title and stacking mode of the graph
# See Plotly documentation for customizations: https://plotly.com/python/reference/bar/
fig.update_layout(
    xaxis_title="{x_axis_title}",
    yaxis_title="{y_axis_title}",
    title="{graph_title}",
    barmode='group',
)
{SHOW_FIG_CODE}""".format(
    CREATE_FIG_CODE=CREATE_FIG_CODE,
    filtered_code=filtered_code,
    trace_code=trace_code,
    x_axis_title=x_axis_title,
    y_axis_title=y_axis_title,
    graph_title=graph_title,
    SHOW_FIG_CODE=SHOW_FIG_CODE
)
