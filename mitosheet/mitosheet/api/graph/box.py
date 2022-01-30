from typing import Any, List
import pandas as pd
from mitosheet.types import ColumnHeader
import plotly.graph_objects as go
from mitosheet.mito_analytics import log
from mitosheet.api.graph.graph_utils import BOX, CREATE_FIG_CODE, SHOW_FIG_CODE, X, filter_df_to_safe_size, get_graph_title, is_all_number_series


def get_box_plot(axis: str, df: pd.DataFrame, column_headers: List[ColumnHeader]) -> go.Figure: 
    """
    Returns a box plot using the following heuristic:

    - If there are 2 or less series, no filtering is required.
    - If there are 3 series, filter to the first BOX_PLOT_3_SERIES_MAX_NUMBER_OF_ROWS rows.
    - If there are 4 series, filter to the first BOX_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS rows.
    """
    fig = go.Figure()

    # Make sure all of the series are NUMBER_SERIES
    if not is_all_number_series(df, column_headers):
        # If not all of the series are numbers, then 
        # return a blank graph
        log(f'failed_generate_graph', {
            'params_graph_type': BOX,
            'params_axis': axis,
            'params_column_headers': column_headers,
            'params_failed_reason': 'non-number-series'
        })
        return go.Figure()
      
    df, filtered = filter_df_to_safe_size(BOX, df, column_headers)

    filter_label = ('top 500k') if filtered else ''
    for column_header in column_headers:
        if axis == X:
            fig.add_trace(go.Box(x=df[column_header], name=(' ').join([str(column_header), filter_label])))
        else:
            fig.add_trace(go.Box(y=df[column_header], name=(' ').join([str(column_header), filter_label])))

    graph_title = get_graph_title(column_headers, [], filtered, BOX)

    fig.update_layout(
        title = graph_title,
        barmode='stack'
    )

    log(f'generate_graph', {
        'params_graph_type': BOX,
        'params_axis': axis,
        'params_column_headers': column_headers,
        'params_filtered': filtered
    })
    
    return fig

def get_box_code(
        axis: str, 
        df: pd.DataFrame, 
        column_headers: List[ColumnHeader],
        df_name: str
    ) -> str:
    """
    Generates the code for a box plot, as is generated.
    """
    _, filtered = filter_df_to_safe_size(BOX, df, column_headers)

    filtered_code = ''
    if filtered:
        filtered_code = """
# Filter the dataframe so that it does not crash the browser
from mitosheet import filter_df_to_safe_size
{df_name}_filtered, _ = filter_df_to_safe_size('box', {df_name}, {column_headers})
""".format(
    df_name=df_name, 
    column_headers=column_headers
)       
        df_name = f'{df_name}_filtered'


    graph_title = get_graph_title(column_headers, [], filtered, BOX)

    

    return """{CREATE_FIG_CODE}
{filtered_code}
# Add box plots to the graph
for column_header in {column_headers}:
    fig.add_trace(go.Box({axis}={df_name}[column_header], name=str(column_header)))

# Update the title and stacking mode of the graph
# See Plotly documentation for customizations: https://plotly.com/python/reference/box/
fig.update_layout(
    title='{graph_title}',
    barmode='stack'
)
{SHOW_FIG_CODE}""".format(
    CREATE_FIG_CODE=CREATE_FIG_CODE,
    df_name=df_name, 
    filtered_code=filtered_code,
    column_headers=column_headers, 
    graph_title=graph_title,
    axis=axis.lower(),
    SHOW_FIG_CODE=SHOW_FIG_CODE
)