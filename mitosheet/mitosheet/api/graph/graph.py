from typing import Any, List
import pandas as pd
from mitosheet.types import ColumnHeader
import plotly.graph_objects as go
import plotly.express as px
from mitosheet.mito_analytics import log
from mitosheet.api.graph.graph_utils import BAR, BOX, CREATE_FIG_CODE, HISTOGRAM, SHOW_FIG_CODE, X, filter_df_to_safe_size, get_barmode, get_graph_title

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
{df_name}_filtered, _ = filter_df_to_safe_size('{graph_type}', {df_name}, {column_headers})
""".format(
    graph_type=graph_type,
    df_name=df_name, 
    column_headers=column_headers
)
    return filtered_code


#TODO figure out how to express a plotly express graph return tyep
def graph_creation(
    graph_type: str, 
    df: pd.DataFrame, 
    x_axis_column_headers: List[ColumnHeader],
    y_axis_column_headers: List[ColumnHeader]
): 
    """
    Creates and returns the Plotly express graph figure
    """
    num_x_axis_column_headers = len(x_axis_column_headers)
    num_y_axis_column_headers = len(y_axis_column_headers)
    
    x_arg = None
    if num_x_axis_column_headers == 1:
        # Note: In the new interface, x will always have a length of 0 or 1
        x_arg = x_axis_column_headers[0]
    if num_x_axis_column_headers > 1:
        x_arg = x_axis_column_headers

    y_arg = None
    if num_y_axis_column_headers == 1:
        y_arg = y_axis_column_headers[0]
    if num_y_axis_column_headers > 1:
        y_arg = y_axis_column_headers
    
    if graph_type == BOX:
        return px.box(df, x=x_arg, y=y_arg)
        
    if graph_type == HISTOGRAM:
        return px.histogram(df, x=x_arg, y=y_arg)

    if graph_type == BAR:
        return px.bar(df, x=x_arg, y=y_arg)
    

def graph_creation_code(
    graph_type: str, 
    df_name: str, 
    x_axis_column_headers: List[ColumnHeader],
    y_axis_column_headers: List[ColumnHeader]
) -> str:
    """
    Returns the code for creating the Plotly express graph
    """
    num_x_axis_column_headers = len(x_axis_column_headers)
    num_y_axis_column_headers = len(y_axis_column_headers)

    x_chord = ''
    if num_x_axis_column_headers == 1:
        # Note: In the new interface, x will always have a length of 0 or 1
        x_chord = f'x="{x_axis_column_headers[0]}"'
    if num_x_axis_column_headers > 1:
        x_arg = f'x={x_axis_column_headers}'

    y_chord = ''
    if num_y_axis_column_headers == 1:
        y_chord = f'y="{y_axis_column_headers[0]}"'
    if num_y_axis_column_headers > 1:
        y_chord = f'y={y_axis_column_headers}'

    all_chords = [df_name, x_chord, y_chord]
    params = (', ').join(list(filter(lambda chord: chord != '', all_chords)))

    if graph_type == BOX:
        return f"fig = px.box({params})"
    if graph_type == HISTOGRAM:
        return f"fig = px.histogram({params})"
    if graph_type == BAR:
        return f"fig = px.bar({params})"
    

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
def get_plotly_express_graph(
    graph_type: str, 
    df: pd.DataFrame, 
    x_axis_column_headers: List[ColumnHeader],
    y_axis_column_headers: List[ColumnHeader]
): 
    """
    Generates and returns a Plotly express graph in 3 steps
    1) filtering -- make sure that dataframe is a safe size to graph
    2) graph creation -- actually construct the graph
    3) graph styling -- style the graph 
    """
    all_column_headers = x_axis_column_headers + y_axis_column_headers

    # Step 1: Filtering
    df, filtered = graph_filtering(graph_type, df, all_column_headers)

    # Step 2: Graph Creation
    fig = graph_creation(graph_type, df, x_axis_column_headers, y_axis_column_headers)

    # Step 3: Graph Styling
    fig = graph_styling(fig, graph_type, all_column_headers, filtered)
    
    return fig

def get_plotly_express_graph_code(
        graph_type: str,
        df: pd.DataFrame, 
        df_name: str,
        x_axis_column_headers: List[ColumnHeader],
        y_axis_column_headers: List[ColumnHeader]
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
    all_column_headers = x_axis_column_headers + y_axis_column_headers

    # TODO: Make a function that just checks if we're going to filter instead of actually doing the filter!
    _, filtered = filter_df_to_safe_size(graph_type, df, all_column_headers)
    code.append(graph_filtering_code(graph_type, df_name, df, all_column_headers))
    df_name = f"{df_name}_filtered" if filtered else df_name

    # Step 2: Graph Creation
    code.append(graph_creation_code(graph_type, df_name, x_axis_column_headers, y_axis_column_headers))

    # Step 3: Graph Styling
    code.append(graph_styling_code(graph_type, all_column_headers, filtered))

    code.append('fig.show()')
    return "\n".join(code)