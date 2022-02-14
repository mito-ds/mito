from typing import Any, List
import pandas as pd
from mitosheet.types import ColumnHeader
import plotly.graph_objects as go
import plotly.express as px
from mitosheet.mito_analytics import log
from mitosheet.api.graph.graph_utils import BOX, CREATE_FIG_CODE, SHOW_FIG_CODE, X, filter_df_to_safe_size, get_graph_title


def graph_filtering(graph_type: str, df, column_headers):
    """
    - If there are 2 or less series, no filtering is required.
    - If there are 3 series, filter to the first BOX_PLOT_3_SERIES_MAX_NUMBER_OF_ROWS rows.
    - If there are 4 series, filter to the first BOX_PLOT_4_SERIES_MAX_NUMBER_OF_ROWS rows.
    """
    return filter_df_to_safe_size(graph_type, df, column_headers)

def graph_filtering_code(graph_type: str, df_name, df, column_headers) -> str:
    _, filtered = filter_df_to_safe_size(BOX, df, column_headers)
    
    if not filtered: 
        return ''
    
    filtered_code = """
# Filter the dataframe so that it does not crash the browser
from mitosheet import filter_df_to_safe_size
, _ = filter_df_to_safe_size('box', {df_name}, {column_headers})
""".format(
    df_name=df_name, 
    column_headers=column_headers
)
    return filtered_code


#TODO figuer out the return type of this function
def graph_creation(axis: str, df: pd.DataFrame, column_headers: List[ColumnHeader]): 
    if axis == X:
        fig = px.box(df, x=column_headers)
    else:
        fig = px.box(df, y=column_headers)
    return fig 

def graph_creation_code(axis: str, df_name: str, column_headers: List[ColumnHeader]) -> str:
    if axis == X:
        return f"fig = px.box({df_name}, x={column_headers})"
    else:
        return f"fig = px.box({df_name}, y={column_headers})"
    

def graph_styling(fig, column_headers, filtered):

    graph_title = get_graph_title(column_headers, [], filtered, BOX)

    fig.update_layout(
        title = graph_title,
        barmode='stack'
    )
    return fig 

def graph_styling_code(column_headers, filtered) -> str:
    graph_title = get_graph_title(column_headers, [], filtered, BOX)

    return f"fig.update_layout(title = '{graph_title}', barmode='stack')"


def get_box_plot(axis: str, df: pd.DataFrame, column_headers: List[ColumnHeader]) -> go.Figure: 
    """
    Returns a box plot:
    """
      
    df, filtered = graph_filtering(BOX, df, column_headers)
    fig = graph_creation(axis, df, column_headers)
    fig = graph_styling(fig, column_headers, filtered)
    
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

    code = [] 

    code.append(graph_filtering_code(BOX, df_name, df, column_headers))

    df_name = "{df_name}_filtered" if filtered else df_name
    code.append(graph_creation_code(axis, df_name, column_headers))

    code.append(graph_styling_code(column_headers, filtered))
    
    return "\n".join(code)