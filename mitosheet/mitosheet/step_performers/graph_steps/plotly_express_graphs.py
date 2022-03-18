#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Dict, List, Optional, Tuple, Union

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from mitosheet.step_performers.graph_steps.graph_utils import (
    BAR,
    BOX,
    DENSITY_CONTOUR,
    DENSITY_HEATMAP,
    ECDF,
    HISTOGRAM,
    LINE,
    SCATTER,
    STRIP,
    VIOLIN,
    create_parameter,
    get_barmode,
    get_graph_title,
)
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code, column_header_to_transpiled_code
from mitosheet.types import ColumnHeader

# TAB is used in place of \t in generated code because
# Jupyter turns \t into a grey arrow, but converts four spaces into a tab.
TAB = "    "

# The number of rows that we filter the graph to
# This must be kept in sync with GRAPH_SAFETY_FILTER_CUTOFF in GraphSidebar.tsx
GRAPH_SAFETY_FILTER_CUTOFF = 1000

# Not all of Ploty's graphs support the color parameter. Those are listed here
GRAPHS_THAT_DONT_SUPPORT_COLOR = [DENSITY_HEATMAP]


def safety_filter_applied(
    df: pd.DataFrame, safety_filter_turned_on_by_user: bool
) -> bool:
    """
    Helper function for determing whether the graphed dataframe
    should be filtered. It is applied if the safety_filter param is true and the
    dataframe has more than FILTERED_NUMBER_OF_ROWS rows
    """
    return (
        safety_filter_turned_on_by_user and len(df.index) > GRAPH_SAFETY_FILTER_CUTOFF
    )


def graph_filtering(
    df: pd.DataFrame, safety_filter_turned_on_by_user: bool
) -> pd.DataFrame:
    """
    Filters the dataframe to the first FILTERED_NUMBER_OF_ROWS rows, to ensure we don't crash the browser tab
    """
    if safety_filter_applied(df, safety_filter_turned_on_by_user):
        return df.head(GRAPH_SAFETY_FILTER_CUTOFF)
    else:
        return df


def graph_filtering_code(
    df_name: str, df: pd.DataFrame, safety_filter_turned_on_by_user: bool
) -> str:
    """
    Returns the code for filtering the dataframe so we don't crash the browser
    """

    if safety_filter_applied(df, safety_filter_turned_on_by_user):
        # If we do filter the graph, then return the code needed to filter the graph
        return """
# Filter the dataframe so that it does not crash the browser
{df_name}_filtered = {df_name}.head({num_rows})
""".format(
            df_name=df_name, num_rows=GRAPH_SAFETY_FILTER_CUTOFF
        )

    else:
        # If we don't filter the graph, then return an empty string
        return ""


def graph_creation(
    graph_type: str,
    df: pd.DataFrame,
    x_axis_column_headers: List[ColumnHeader],
    y_axis_column_headers: List[ColumnHeader],
    color_column_header: Optional[ColumnHeader]
) -> go.Figure:
    """
    Creates and returns the Plotly express graph figure
    """

    # Create the parameters that we use to construct the graph
    all_params: Dict[str, Union[ColumnHeader, List[ColumnHeader], None]] = dict()

    # Plotly express requires that both the x and y parameter cannot both be lists,
    # so we need to do some casing.
    if len(x_axis_column_headers) == 1:
        # Note: In the new interface, x will always have a length of 0 or 1
        all_params["x"] = x_axis_column_headers[0]
    elif len(x_axis_column_headers) > 1:
        all_params["x"] = x_axis_column_headers

    if len(y_axis_column_headers) == 1:
        all_params["y"] = y_axis_column_headers[0]
    elif len(y_axis_column_headers) > 1:
        all_params["y"] = y_axis_column_headers

    if graph_type not in GRAPHS_THAT_DONT_SUPPORT_COLOR:
        all_params['color'] = color_column_header

    if graph_type == BAR:
        return px.bar(df, **all_params)
    elif graph_type == LINE:
        return px.line(df, **all_params)
    elif graph_type == SCATTER:
        return px.scatter(df, **all_params)
    elif graph_type == HISTOGRAM:
        return px.histogram(df, **all_params)
    elif graph_type == DENSITY_HEATMAP:
        return px.density_heatmap(df, **all_params)
    elif graph_type == DENSITY_CONTOUR:
        return px.density_contour(df, **all_params)
    elif graph_type == BOX:
        return px.box(df, **all_params)
    elif graph_type == VIOLIN:
        return px.violin(df, **all_params)
    elif graph_type == STRIP:
        return px.strip(df, **all_params)
    elif graph_type == ECDF:
        return px.ecdf(df, **all_params)


def graph_creation_code(
    graph_type: str,
    df_name: str,
    x_axis_column_headers: List[ColumnHeader],
    y_axis_column_headers: List[ColumnHeader],
    color_column_header: Optional[ColumnHeader]
) -> str:
    """
    Returns the code for creating the Plotly express graph
    """

    # Create the params used to construct the graph
    all_params: List[Tuple[str, str, bool]] = []

    if len(x_axis_column_headers) == 1:
        all_params.append(("x", column_header_to_transpiled_code(x_axis_column_headers[0]), False))
    elif len(x_axis_column_headers) >= 1:
        all_params.append(("x", column_header_list_to_transpiled_code(x_axis_column_headers), False))

    if len(y_axis_column_headers) == 1:
        all_params.append(("y", column_header_to_transpiled_code(y_axis_column_headers[0]), False))
    elif len(y_axis_column_headers) >= 1:
        all_params.append(("y", column_header_list_to_transpiled_code(y_axis_column_headers), False))

    if color_column_header is not None:
        all_params.append(('color', column_header_to_transpiled_code(color_column_header), False))

    params = f", ".join(
        create_parameter(param[0], param[1], param[2]) for param in all_params
    )

    if graph_type == BAR:
        return f"fig = px.bar({df_name}, {params})"
    elif graph_type == LINE:
        return f"fig = px.line({df_name}, {params})"
    elif graph_type == SCATTER:
        return f"fig = px.scatter({df_name}, {params})"
    elif graph_type == HISTOGRAM:
        return f"fig = px.histogram({df_name}, {params})"
    elif graph_type == DENSITY_HEATMAP:
        return f"fig = px.density_heatmap({df_name}, {params})"
    elif graph_type == DENSITY_CONTOUR:
        return f"fig = px.density_contour({df_name}, {params})"
    elif graph_type == BOX:
        return f"fig = px.box({df_name}, {params})"
    elif graph_type == VIOLIN:
        return f"fig = px.violin({df_name}, {params})"
    elif graph_type == STRIP:
        return f"fig = px.strip({df_name}, {params})"
    elif graph_type == ECDF:
        return f"fig = px.ecdf({df_name}, {params})"
    return ""


def graph_styling(
    fig: go.Figure, graph_type: str, column_headers: List[ColumnHeader], filtered: bool
) -> go.Figure:
    """
    Styles the Plotly express graph figure
    """

    # Create the parameters that we use to style the graph
    graph_title = get_graph_title(column_headers, [], filtered, graph_type)
    barmode = get_barmode(graph_type)

    # Actually update the style of the graph
    fig.update_layout(
        title=graph_title,
        barmode=barmode,
        xaxis=dict(rangeslider=dict(visible=True, thickness=0.05)),
    )
    return fig


def graph_styling_code(
    graph_type: str, column_headers: List[ColumnHeader], filtered: bool
) -> str:
    """
    Returns the code for styling the Plotly express graph
    """

    # Create the params used to style the graph
    all_params: List[Tuple[str, str, bool]] = []

    graph_title = get_graph_title(column_headers, [], filtered, graph_type)
    all_params.append(("title", graph_title, True))

    barmode = get_barmode(graph_type)
    if barmode is not None:
        all_params.append(("barmode", barmode, True))

    RANGE_SLIDER = """dict(
        rangeslider=dict(
            visible=True,
            thickness=.05
        )
    )"""
    all_params.append(("xaxis", RANGE_SLIDER, False))

    params = f"\n{TAB}"
    params += f",\n{TAB}".join(
        create_parameter(param[0], param[1], param[2]) for param in all_params
    )
    params += "\n"

    return f"fig.update_layout({params})"


def get_plotly_express_graph(
    graph_type: str,
    df: pd.DataFrame,
    safety_filter_turned_on_by_user: bool,
    x_axis_column_headers: List[ColumnHeader],
    y_axis_column_headers: List[ColumnHeader],
    color_column_header: Optional[ColumnHeader]
) -> go.Figure:
    """
    Generates and returns a Plotly express graph in 3 steps
    1) filtering -- make sure that dataframe is a safe size to graph
    2) graph creation -- actually construct the graph
    3) graph styling -- style the graph
    """
    all_column_headers = x_axis_column_headers + y_axis_column_headers

    # Step 1: Filtering
    is_safety_filter_applied = safety_filter_applied(
        df, safety_filter_turned_on_by_user
    )
    df = graph_filtering(df, safety_filter_turned_on_by_user)

    # Step 2: Graph Creation
    fig = graph_creation(graph_type, df, x_axis_column_headers, y_axis_column_headers, color_column_header)

    # Step 3: Graph Styling
    fig = graph_styling(fig, graph_type, all_column_headers, is_safety_filter_applied)

    return fig


def get_plotly_express_graph_code(
    graph_type: str,
    df: pd.DataFrame,
    safety_filter_turned_on_by_user: bool,
    x_axis_column_headers: List[ColumnHeader],
    y_axis_column_headers: List[ColumnHeader],
    color_column_header: Optional[ColumnHeader],
    df_name: str,
) -> str:
    """
    Generates the code for a Plotly express graph in 3 steps
    1) filtering -- make sure that dataframe is a safe size to graph
    2) graph creation -- actually construct the graph
    3) graph styling -- style the graph
    """

    code = []
    code.append("import plotly.express as px")

    # Step 1: Filtering
    is_safety_filter_applied = safety_filter_applied(
        df, safety_filter_turned_on_by_user
    )
    if is_safety_filter_applied:
        code.append(graph_filtering_code(df_name, df, safety_filter_turned_on_by_user))
        df_name = f"{df_name}_filtered"

    # Step 2: Graph Creation
    code.append(
        "# Construct the graph and style it. Further customize your graph by editing this code."
    )
    code.append(
        "# See Plotly Documentation for help: https://plotly.com/python/plotly-express/"
    )
    code.append(
        graph_creation_code(
            graph_type, df_name, x_axis_column_headers, y_axis_column_headers, color_column_header
        )
    )

    # Step 3: Graph Styling
    all_column_headers = x_axis_column_headers + y_axis_column_headers
    code.append(
        graph_styling_code(graph_type, all_column_headers, is_safety_filter_applied)
    )

    # We use fig.show(renderer="iframe") which works in both JLab 2 & 3
    # and renders in line,
    code.append('fig.show(renderer="iframe")')

    return "\n".join(code)
