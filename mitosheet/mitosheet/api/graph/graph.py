from typing import Any, List
import pandas as pd
from mitosheet.types import ColumnHeader
import plotly.graph_objects as go
import plotly.express as px
from mitosheet.mito_analytics import log
from mitosheet.api.graph.graph_utils import BOX, CREATE_FIG_CODE, HISTOGRAM, SHOW_FIG_CODE, X, filter_df_to_safe_size, get_barmode, get_graph_title

def graph_filtering(graph_type: str, df, column_headers):
    """
    Filteres the dataframe about to be graphed so that we don't crash the browser
    """
    return filter_df_to_safe_size(graph_type, df, column_headers)

def graph_filtering_code(graph_type: str, df_name, df, column_headers) -> str:
    """
    Returns the code for filtering the dataframe so we don't crash the browswer
    """
    _, filtered = filter_df_to_safe_size(graph_type, df, column_headers)
    
    if not filtered: 
        return ''
    
    filtered_code = """
# Filter the dataframe so that it does not crash the browser
from mitosheet import filter_df_to_safe_size
, _ = filter_df_to_safe_size('{graph_type}', {df_name}, {column_headers})
""".format(
    df_name=df_name, 
    column_headers=column_headers
)
    return filtered_code


#TODO figure out how to express a plotly express graph return tyep
def graph_creation(graph_type: str, axis: str, df: pd.DataFrame, column_headers: List[ColumnHeader]): 
    """
    Creates and returns the Plotly express graph figure
    """
    if graph_type == BOX:
        if axis == X:
            return px.box(df, x=column_headers)
        else:
            return px.box(df, y=column_headers)
    if graph_type == HISTOGRAM:
        if axis == X:
            return px.histogram(df, x=column_headers)
        else:
            return px.histogram(df, y=column_headers)


def graph_creation_code(graph_type: str, axis: str, df_name: str, column_headers: List[ColumnHeader]) -> str:
    """
    Returns the code for creating the Plotly express graph
    """
    if graph_type == BOX:
        if axis == X:
            return f"fig = px.box({df_name}, x={column_headers})"
        else:
            return f"fig = px.box({df_name}, y={column_headers})"
    if graph_type == HISTOGRAM:
        if axis == X:
            return f"fig = px.histogram({df_name}, x={column_headers})"
        else:
            return f"fig = px.histogram({df_name}, y={column_headers})"
    

def graph_styling(fig, graph_type: str, column_headers: List[ColumnHeader], filtered: bool):
    """
    Styles the Plotly express graph figure
    """

    graph_title = get_graph_title(column_headers, [], filtered, graph_type)
    barmode = get_barmode(graph_type)

    fig.update_layout(
        title = graph_title,
        barmode=barmode
    )
    return fig 


def graph_styling_code(graph_type: str, column_headers: List[ColumnHeader], filtered: bool) -> str:
    """
    Returns the code for styling the Plotly express graph
    """
    graph_title = get_graph_title(column_headers, [], filtered, graph_type)
    barmode = get_barmode(graph_type)

    return f"fig.update_layout(title='{graph_title}', barmode='{barmode}')"


#TODO figure out how to express a plotly express graph return type
def get_plotly_express_graph(graph_type: str, axis: str, df: pd.DataFrame, column_headers: List[ColumnHeader]): 
    """
    Generates and returns a Plotly express graph in 3 steps
    1) filtering -- make sure that dataframe is a safe size to graph
    2) graph creation -- actually construct the graph
    3) graph styling -- style the graph 
    """
    # Step 1: Filtering
    df, filtered = graph_filtering(graph_type, df, column_headers)

    # Step 2: Graph Creation
    fig = graph_creation(graph_type, axis, df, column_headers)

    # Step 3: Graph Styling
    fig = graph_styling(fig, graph_type, column_headers, filtered)
    
    return fig

def get_plotly_express_graph_code(
        graph_type: str,
        axis: str, 
        df: pd.DataFrame, 
        column_headers: List[ColumnHeader],
        df_name: str
    ) -> str:
    """
    Generates the code for a Plotly express graph in 3 steps
    1) filtering -- make sure that dataframe is a safe size to graph
    2) graph creation -- actually construct the graph
    3) graph styling -- style the graph 
    """

    code = [] 
    code.append('import plotly.express as px')

    # Step 1: Filtering
    _, filtered = filter_df_to_safe_size(BOX, df, column_headers)
    code.append(graph_filtering_code(graph_type, df_name, df, column_headers))
    df_name = "{df_name}_filtered" if filtered else df_name

    # Step 2: Graph Creation
    code.append(graph_creation_code(graph_type, axis, df_name, column_headers))

    # Step 3: Graph Styling
    code.append(graph_styling_code(graph_type, column_headers, filtered))

    code.append('fig.show()')
    return "\n".join(code)