#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import Any, Dict, List, Optional, Tuple, Union

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
    get_graph_title,
)
from mitosheet.transpiler.transpile_utils import param_dict_to_code
from mitosheet.types import ColumnHeader

DO_NOT_CHANGE_PAPER_BGCOLOR_DEFAULT = '#FFFFFF'
DO_NOT_CHANGE_PLOT_BGCOLOR_DEFAULT = '#E6EBF5'
DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT = '#2F3E5D'

# The number of rows that we filter the graph to
# This must be kept in sync with GRAPH_SAFETY_FILTER_CUTOFF in GraphSidebar.tsx
GRAPH_SAFETY_FILTER_CUTOFF = 1000

# Not all of Ploty's graphs support the color parameter. Those are listed here
GRAPHS_THAT_DONT_SUPPORT_COLOR = [DENSITY_HEATMAP]

RANGE_SLIDER_CODE = """dict(
        rangeslider=dict(
            visible=True,
            thickness=.05
        )
    )"""


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

def get_graph_creation_param_dict(
        graph_type: str,
        x_axis_column_headers: List[ColumnHeader],
        y_axis_column_headers: List[ColumnHeader],
        color_column_header: Optional[ColumnHeader],
        facet_col_column_header: Optional[ColumnHeader],
        facet_row_column_header: Optional[ColumnHeader],
        facet_col_wrap: Optional[int],
        facet_col_spacing: Optional[float],
        facet_row_spacing: Optional[float],
        points: Optional[Union[str, bool]],
        line_shape: Optional[str],
        histnorm: Optional[str],
        histfunc: Optional[str],
        nbins: Optional[int],


    ) -> Dict[str, Any]:

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

    if graph_type not in GRAPHS_THAT_DONT_SUPPORT_COLOR and color_column_header is not None:
        all_params['color'] = color_column_header

    if facet_col_column_header is not None:
        all_params['facet_col'] = facet_col_column_header

    if facet_row_column_header is not None:
        all_params['facet_row'] = facet_row_column_header

    if facet_col_wrap is not None: 
        all_params['facet_col_wrap'] = facet_col_wrap

    if facet_col_spacing is not None:
        all_params['facet_col_spacing'] = facet_col_spacing

    if facet_row_spacing is not None:
        all_params['facet_row_spacing'] = facet_row_spacing

    if points is not None:
        all_params['points'] = points

    if line_shape is not None:
        all_params['line_shape'] = line_shape

    if nbins is not None: 
        all_params['nbins'] = nbins

    if histnorm is not None:
        all_params['histnorm'] = histnorm

    if histfunc is not None:
        all_params['histfunc'] = histfunc

    return all_params

def graph_creation(
    graph_type: str,
    df: pd.DataFrame,
    x_axis_column_headers: List[ColumnHeader],
    y_axis_column_headers: List[ColumnHeader],
    color_column_header: Optional[ColumnHeader],
    facet_col_column_header: Optional[ColumnHeader],
    facet_row_column_header: Optional[ColumnHeader],
    facet_col_wrap: Optional[int],
    facet_col_spacing: Optional[float],
    facet_row_spacing: Optional[float],
    points: Optional[Union[str, bool]],
    line_shape: Optional[str],
    histnorm: Optional[str],
    histfunc: Optional[str],
    nbins: Optional[int],

) -> go.Figure:
    """
    Creates and returns the Plotly express graph figure
    """

    param_dict = get_graph_creation_param_dict(
        graph_type, 
        x_axis_column_headers, 
        y_axis_column_headers, 
        color_column_header, 
        facet_col_column_header, 
        facet_row_column_header,
        facet_col_wrap,
        facet_col_spacing,
        facet_row_spacing,
        points,
        line_shape,
        histnorm,
        histfunc,
        nbins,

    )

    if graph_type == BAR:
        return px.bar(df, **param_dict)
    elif graph_type == LINE:
        return px.line(df, **param_dict)
    elif graph_type == SCATTER:
        return px.scatter(df, **param_dict)
    elif graph_type == HISTOGRAM:
        return px.histogram(df, **param_dict)
    elif graph_type == DENSITY_HEATMAP:
        return px.density_heatmap(df, **param_dict)
    elif graph_type == DENSITY_CONTOUR:
        return px.density_contour(df, **param_dict)
    elif graph_type == BOX:
        return px.box(df, **param_dict)
    elif graph_type == VIOLIN:
        return px.violin(df, **param_dict)
    elif graph_type == STRIP:
        return px.strip(df, **param_dict)
    elif graph_type == ECDF:
        return px.ecdf(df, **param_dict)


def graph_creation_code(
    graph_type: str,
    df_name: str,
    x_axis_column_headers: List[ColumnHeader],
    y_axis_column_headers: List[ColumnHeader],
    color_column_header: Optional[ColumnHeader],
    facet_col_column_header: Optional[ColumnHeader],
    facet_row_column_header: Optional[ColumnHeader],
    facet_col_wrap: Optional[int],
    facet_col_spacing: Optional[float],
    facet_row_spacing: Optional[float],
    points: Optional[Union[str, bool]],
    line_shape: Optional[str],
    histnorm: Optional[str],
    histfunc: Optional[str],
    nbins: Optional[int],

) -> str:
    """
    Returns the code for creating the Plotly express graph
    """

    param_dict = get_graph_creation_param_dict(
        graph_type, 
        x_axis_column_headers, 
        y_axis_column_headers, 
        color_column_header, 
        facet_col_column_header, 
        facet_row_column_header,
        facet_col_wrap,
        facet_col_spacing,
        facet_row_spacing,
        points,
        line_shape,
        histnorm,
        histfunc,
        nbins,
    )
    param_code = param_dict_to_code(param_dict, as_single_line=True)

    if graph_type == BAR:
        return f"fig = px.bar({df_name}, {param_code})"
    elif graph_type == LINE:
        return f"fig = px.line({df_name}, {param_code})"
    elif graph_type == SCATTER:
        return f"fig = px.scatter({df_name}, {param_code})"
    elif graph_type == HISTOGRAM:
        return f"fig = px.histogram({df_name}, {param_code})"
    elif graph_type == DENSITY_HEATMAP:
        return f"fig = px.density_heatmap({df_name}, {param_code})"
    elif graph_type == DENSITY_CONTOUR:
        return f"fig = px.density_contour({df_name}, {param_code})"
    elif graph_type == BOX:
        return f"fig = px.box({df_name}, {param_code})"
    elif graph_type == VIOLIN:
        return f"fig = px.violin({df_name}, {param_code})"
    elif graph_type == STRIP:
        return f"fig = px.strip({df_name}, {param_code})"
    elif graph_type == ECDF:
        return f"fig = px.ecdf({df_name}, {param_code})"
    return ""

def get_graph_styling_param_dict(graph_type: str, column_headers: List[ColumnHeader], filtered: bool, graph_styling_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    A param dict is a potentially nested dictonary with strings as keys with
    """
    # Create the parameters that we use to construct the graph
    all_params: Dict[str, Any] = dict()

    # Create the graph title param
    if graph_styling_params['title']['visible']:
        use_custom_title = 'title' in graph_styling_params['title']
        if use_custom_title:
            all_params['title'] = graph_styling_params['title']['title']
        else:
            all_params['title'] = get_graph_title(column_headers, [], filtered, graph_type)

        # Set the font color of the main title, if it has been changed
        title_font_color = graph_styling_params['title']['title_font_color']
        if title_font_color != DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT:
            all_params['title_font_color'] = title_font_color

    # Create the x axis param
    all_params['xaxis'] = dict()
    if graph_styling_params['xaxis']['visible']:
        # If the x axis title is visible, then either dispaly the user's custom title or Ploty's default title.
        use_custom_xaxis_title = 'title' in graph_styling_params['xaxis']
        # Only apply the xaxis title if it is set because if we set it to None, then we don't get ploty's default values
        if use_custom_xaxis_title:
            all_params['xaxis']['title'] = graph_styling_params['xaxis']['title']
        
        # Set the color of the axis, if it is not default
        xaxis_title_font_color = graph_styling_params['xaxis']['title_font_color']
        if xaxis_title_font_color != DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT:
            all_params['xaxis']['title_font_color'] = xaxis_title_font_color
    else: 
        # Plotly makes us explicitly handle setting the xaxis title and yaxis title to None
        all_params['xaxis']['title'] = None

    if 'type' in graph_styling_params['xaxis']:
        all_params['xaxis']['type'] = graph_styling_params['xaxis']['type']

    all_params['xaxis']['showgrid'] = graph_styling_params['xaxis']['showgrid']

    if 'gridwidth' in graph_styling_params['xaxis']:
        all_params['xaxis']['gridwidth'] = float(graph_styling_params['xaxis']['gridwidth'])

    # Create the range slider param
    if graph_styling_params['xaxis']['rangeslider']['visible']:
        all_params['xaxis']['rangeslider'] = dict(visible=True, thickness=0.05)

    # Create the y axis title param
    all_params['yaxis'] = dict()
    if graph_styling_params['yaxis']['visible']:
        # If the y axis title is visible, then either dispaly the user's custom title or Ploty's default title.
        use_custom_yaxis_title = 'title' in graph_styling_params['yaxis']
        # Only apply the xaxis_title if it is set because if we set it to None, then we don't get ploty's default values
        if use_custom_yaxis_title:
            all_params['yaxis']['title'] = graph_styling_params['yaxis']['title']

        # Set the color of the axis, if it is not default
        yaxis_title_font_color = graph_styling_params['yaxis']['title_font_color']
        if yaxis_title_font_color != DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT:
            all_params['yaxis']['title_font_color'] = yaxis_title_font_color
    else: 
        # Plotly makes us explicitly handle setting the xaxis_title and yaxis_title to None
        all_params['yaxis']['title'] = None

    if 'type' in graph_styling_params['yaxis']:
        all_params['yaxis']['type'] = graph_styling_params['yaxis']['type']

    all_params['yaxis']['showgrid'] = graph_styling_params['yaxis']['showgrid']

    if 'gridwidth' in graph_styling_params['yaxis']:
        all_params['yaxis']['gridwidth'] = float(graph_styling_params['yaxis']['gridwidth'])

    # Create the legend params
    if graph_styling_params['showlegend']:
        all_params['legend'] = dict()
        all_params['legend']['orientation'] = graph_styling_params['legend']['orientation']

        if 'legend' in graph_styling_params:
            if 'title' in graph_styling_params['legend'] and 'text' in graph_styling_params['legend']['title']:
                all_params['legend']['title'] = dict()
                text = graph_styling_params['legend']['title']['text']
                all_params['legend']['title']['text'] = text
            
            if 'x' in graph_styling_params['legend']:
                all_params['legend']['x'] = float(graph_styling_params['legend']['x'])

            if 'y' in graph_styling_params['legend']:
                all_params['legend']['y'] = float(graph_styling_params['legend']['y'])
    else: 
        # Only add the graph styling param if it is false, otherwise we rely on Ploty default
        all_params['showlegend'] = graph_styling_params['showlegend']
   
    # Create the barmode param
    if 'barmode' in graph_styling_params:
        all_params['barmode'] = graph_styling_params['barmode']

    if 'barnorm' in graph_styling_params:
        all_params['barnorm'] = graph_styling_params['barnorm']

    # Create the background params
    paper_bgcolor = graph_styling_params['paper_bgcolor']
    if graph_styling_params != DO_NOT_CHANGE_PAPER_BGCOLOR_DEFAULT: # NOTE: we don't need to set if it's a default
        all_params['paper_bgcolor'] = paper_bgcolor
    plot_bgcolor = graph_styling_params['plot_bgcolor']
    if plot_bgcolor != DO_NOT_CHANGE_PLOT_BGCOLOR_DEFAULT: # NOTE: we don't need to set if it's a default
        all_params['plot_bgcolor'] = plot_bgcolor

    return all_params


def graph_styling(
    fig: go.Figure, graph_type: str, column_headers: List[ColumnHeader], filtered: bool, graph_styling_params: Dict[str, Any]
) -> go.Figure:
    """
    Styles the Plotly express graph figure
    """
    param_dict = get_graph_styling_param_dict(graph_type, column_headers, filtered, graph_styling_params) 

    # Actually update the style of the graph
    fig.update_layout(
        **param_dict
    )
    return fig


def graph_styling_code(
    graph_type: 
    str, column_headers: List[ColumnHeader], 
    filtered: bool,
    graph_styling_params: Dict[str, Any]
) -> str:
    """
    Returns the code for styling the Plotly express graph
    """
    param_dict = get_graph_styling_param_dict(graph_type, column_headers, filtered, graph_styling_params) 
    params_code = param_dict_to_code(param_dict)
    return f"fig.update_layout({params_code})"


def get_plotly_express_graph(
    graph_type: str,
    df: pd.DataFrame,
    safety_filter_turned_on_by_user: bool,
    x_axis_column_headers: List[ColumnHeader],
    y_axis_column_headers: List[ColumnHeader],
    color_column_header: Optional[ColumnHeader],
    facet_col_column_header: Optional[ColumnHeader],
    facet_row_column_header: Optional[ColumnHeader],
    facet_col_wrap: Optional[int],
    facet_col_spacing: Optional[float],
    facet_row_spacing: Optional[float],
    points: Optional[Union[str, bool]],
    line_shape: Optional[str],
    histnorm: Optional[str],
    histfunc: Optional[str],
    nbins: Optional[int],
    graph_styling_params: Dict[str, Any],
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
    fig = graph_creation(
        graph_type, 
        df, 
        x_axis_column_headers, 
        y_axis_column_headers, 
        color_column_header, 
        facet_col_column_header, 
        facet_row_column_header,
        facet_col_wrap,
        facet_col_spacing,
        facet_row_spacing,
        points,
        line_shape,
        histnorm,
        histfunc,
        nbins,
    )

    # Step 3: Graph Styling
    fig = graph_styling(fig, graph_type, all_column_headers, is_safety_filter_applied, graph_styling_params)

    return fig


def get_plotly_express_graph_code(
    graph_type: str,
    df: pd.DataFrame,
    safety_filter_turned_on_by_user: bool,
    x_axis_column_headers: List[ColumnHeader],
    y_axis_column_headers: List[ColumnHeader],
    color_column_header: Optional[ColumnHeader],
    facet_col_column_header: Optional[ColumnHeader],
    facet_row_column_header: Optional[ColumnHeader],
    facet_col_wrap: Optional[int],
    facet_col_spacing: Optional[float],
    facet_row_spacing: Optional[float],
    points: Optional[Union[str, bool]],
    line_shape: Optional[str],
    histnorm: Optional[str],
    histfunc: Optional[str],
    nbins: Optional[int],
    graph_styling_params: Dict[str, Any],
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
            graph_type, 
            df_name, 
            x_axis_column_headers, 
            y_axis_column_headers, 
            color_column_header, 
            facet_col_column_header,
            facet_row_column_header,
            facet_col_wrap,
            facet_col_spacing,
            facet_row_spacing,
            points,
            line_shape,
            histnorm,
            histfunc,
            nbins,
        )
    )

    # Step 3: Graph Styling
    all_column_headers = x_axis_column_headers + y_axis_column_headers
    code.append(
        graph_styling_code(graph_type, all_column_headers, is_safety_filter_applied, graph_styling_params)
    )

    return "\n".join(code)
