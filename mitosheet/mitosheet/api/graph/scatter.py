from typing import Any, List
import pandas as pd
from mitosheet.types import ColumnHeader
import plotly.graph_objects as go
from mitosheet.mito_analytics import log
from mitosheet.sheet_functions.types.utils import get_mito_type
from mitosheet.api.graph.graph_utils import BAR, CREATE_FIG_CODE, SCATTER, SHOW_FIG_CODE, X, Y, filter_df_to_safe_size, get_graph_labels, get_graph_title
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code


def get_scatter_plot(df: pd.DataFrame, x_axis_column_headers: List[ColumnHeader], y_axis_column_headers: List[ColumnHeader]) -> go.Figure:
    """
    Returns a scatter plot using the following heuristic:

    - If a non-number series exists, filter the df to contain the most common MAX_UNIQUE_NON_NUMBER_VALUES
    - Graph the first SCATTER_PLOT_MAX_NUMBER_OF_ROWS rows regardless of the type of the series. 
    """
    fig = go.Figure()
    original_length_of_df = len(df)

    x_axis = len(x_axis_column_headers) != 0
    y_axis = len(y_axis_column_headers) != 0

    # If no data is passed, return a blank graph
    if not x_axis and not y_axis:
        # This should never happen because this check already occurs in the get_graph
        # function. But we leave it here for robustness of the function
        return go.Figure()

    # Check the type of each series to appropriately filter 
    all_column_headers = x_axis_column_headers + y_axis_column_headers
    df, filtered = filter_df_to_safe_size(SCATTER, df, all_column_headers)

    # Determine if the dataframe was sorted
    filter_label = ''
    if len(df) < original_length_of_df: 
        filter_label = '(first 10k)' if len(all_column_headers) < 4 else '(first 5k)'
    
    # If only one axis is defined, plotly defaults to using
    # the index column as the other axis. This is also what Google Sheets
    # does, so we do it too.    
    if x_axis and not y_axis:
        # Only an x_axis was provided
        for column_header in x_axis_column_headers:
            fig.add_trace(go.Scatter(
                y=df[column_header], 
                mode='markers',
                name=(' ').join([str(column_header), filter_label])
            ))
    elif not x_axis and y_axis:
        # Only a y axis was provided
        for column_header in y_axis_column_headers:
            fig.add_trace(go.Scatter(
                x=df[column_header],
                mode='markers',
                name=(' ').join([str(column_header), filter_label])
            ))
    elif len(y_axis_column_headers) == 1:
        # If the y axis only has one column header, then we use that as the key
        for column_header in x_axis_column_headers:
            fig.add_trace(go.Scatter(
                x=df[column_header], 
                y=df[y_axis_column_headers[0]],
                mode='markers',
                name=(' ').join([str(column_header), filter_label])
            ))
    else:
        # It should not be possible for both the x axis and y axis 
        # to have more than 1 column. But if it does happen, we default 
        # to using the first column of the x axis as the key
        for column_header in y_axis_column_headers:
            fig.add_trace(go.Scatter(
                x=df[x_axis_column_headers[0]], 
                y=df[column_header],
                mode='markers',
                name=(' ').join([str(column_header), filter_label])
            ))

    # Update the layout of the graph
    x_axis_title, y_axis_title = get_graph_labels(x_axis_column_headers, y_axis_column_headers)
    graph_title = get_graph_title(x_axis_column_headers, y_axis_column_headers, filtered, SCATTER)
    fig.update_layout(
        xaxis_title=x_axis_title,
        yaxis_title=y_axis_title,
        title=graph_title,
    )

    log(f'generate_graph', {
        'params_graph_type': SCATTER,
        'params_x_axis_column_headers': x_axis_column_headers,
        'params_x_axis_column_types': [get_mito_type(df[column_header]) for column_header in x_axis_column_headers] if x_axis_column_headers is not None else [],
        'params_y_axis_column_headers': y_axis_column_headers,
        'params_y_axis_column_types': [get_mito_type(df[column_header]) for column_header in y_axis_column_headers] if y_axis_column_headers is not None else [],
        'params_filtered': filtered,
    })

    return fig

def get_scatter_code(
        df: pd.DataFrame, 
        x_axis_column_headers: List[ColumnHeader], 
        y_axis_column_headers: List[ColumnHeader],
        df_name: str
    ) -> str:
    """
    Generates code for a scatter plot.
    """
    _, filtered = filter_df_to_safe_size(SCATTER, df, x_axis_column_headers + y_axis_column_headers)

    filtered_code = ''
    if filtered:
        filtered_code = """
# Filter the dataframe so that it doesn't crash the browser with too much data
from mitosheet import filter_df_to_safe_size
{df_name}_filtered, _ = filter_df_to_safe_size('scatter', {df_name}, {column_headers})
""".format(
    df_name=df_name,
    column_headers=x_axis_column_headers + y_axis_column_headers
)
        df_name = f'{df_name}_filtered'

    x_axis = len(x_axis_column_headers) != 0
    y_axis = len(y_axis_column_headers) != 0      

    if x_axis and not y_axis:
        # Only an x_axis was provided
        trace_code = """
# Add the scatter traces to the figure
for column_header in {x_axis_column_headers}:
    fig.add_trace(go.Scatter(
        y={df_name}[column_header], 
        mode='markers',
        name=str(column_header)
    ))
""".format(
    df_name=df_name, 
    x_axis_column_headers=x_axis_column_headers
)
        
    elif not x_axis and y_axis:
                trace_code = """
# Add the scatter traces to the figure
for column_header in {y_axis_column_headers}:
    fig.add_trace(go.Scatter(
        x={df_name}[column_header], 
        mode='markers',
        name=str(column_header)
    ))
""".format(
    df_name=df_name, 
    y_axis_column_headers=y_axis_column_headers
)
    elif len(y_axis_column_headers) == 1:
        transpiled_y_axis_column_header = column_header_to_transpiled_code(y_axis_column_headers[0])
        trace_code = """
# Add the scatter traces to the figure
for column_header in {x_axis_column_headers}:
    fig.add_trace(go.Scatter(
        x={df_name}[column_header],
        y={df_name}[{transpiled_y_axis_column_header}],
        mode='markers',
        name=str(column_header)
    ))
""".format(
    df_name=df_name, 
    x_axis_column_headers=x_axis_column_headers,
    transpiled_y_axis_column_header=transpiled_y_axis_column_header
)
    else:
        transpiled_x_axis_column_header = column_header_to_transpiled_code(x_axis_column_headers[0])
        trace_code = """
# Add the scatter traces to the figure
for column_header in {y_axis_column_headers}:
    fig.add_trace(go.Scatter(
        x={df_name}['{transpiled_x_axis_column_header}'],
        y={df_name}[column_header],
        mode='markers',
        name=str(column_header)
    ))
""".format(
    df_name=df_name, 
    y_axis_column_headers=y_axis_column_headers,
    transpiled_x_axis_column_header=transpiled_x_axis_column_header
)

    x_axis_title, y_axis_title = get_graph_labels(x_axis_column_headers, y_axis_column_headers)
    graph_title = get_graph_title(x_axis_column_headers, y_axis_column_headers, filtered, SCATTER)


    return """{CREATE_FIG_CODE}
{filtered_code}
{trace_code}
# Update the layout
# See Plotly documentation for cutomizations: https://plotly.com/python/reference/scatter/
fig.update_layout(
    xaxis_title="{x_axis_title}",
    yaxis_title="{y_axis_title}",
    title="{graph_title}",
)
{SHOW_FIG_CODE}""".format(
    CREATE_FIG_CODE=CREATE_FIG_CODE,
    trace_code=trace_code,
    filtered_code=filtered_code,
    x_axis_title=x_axis_title, 
    y_axis_title=y_axis_title,
    graph_title=graph_title,
    SHOW_FIG_CODE=SHOW_FIG_CODE
)