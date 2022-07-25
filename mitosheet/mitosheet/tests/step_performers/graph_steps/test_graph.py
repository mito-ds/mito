#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pandas as pd
import pytest
from mitosheet.step_performers.graph_steps.graph_utils import (BAR, BOX,
                                                               DENSITY_CONTOUR,
                                                               DENSITY_HEATMAP,
                                                               ECDF, HISTOGRAM,
                                                               LINE, SCATTER,
                                                               STRIP, VIOLIN)
from mitosheet.tests.test_utils import create_mito_wrapper_dfs


def test_create_empty_graph():
    df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df)
    graph_id = '123'
    mito.generate_graph(graph_id, BAR, 0, False, [], [], 400, 400)

    assert len(mito.steps_including_skipped) == 2
    assert mito.curr_step.step_type == 'graph'

    assert mito.get_graph_type(graph_id) == BAR
    assert mito.get_graph_sheet_index(graph_id) == 0
    assert mito.get_graph_axis_column_ids(graph_id, 'x') == []
    assert mito.get_graph_axis_column_ids(graph_id, 'y') == []
    assert mito.get_is_graph_output_none(graph_id)


GRAPH_CREATION_TESTS = [
    BAR, BOX,
    DENSITY_CONTOUR,
    DENSITY_HEATMAP,
    ECDF, HISTOGRAM,
    LINE, SCATTER,
    STRIP, VIOLIN
]

@pytest.mark.parametrize("graph_type", GRAPH_CREATION_TESTS)
def test_create_graph(graph_type):
    df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df)
    graph_id = '123'
    mito.generate_graph(graph_id, graph_type, 0, False, ['A'], ['B'], 400, 400)

    assert len(mito.steps_including_skipped) == 2
    assert mito.curr_step.step_type == 'graph'

    assert mito.get_graph_type(graph_id) == graph_type
    assert mito.get_graph_sheet_index(graph_id) == 0
    assert mito.get_graph_axis_column_ids(graph_id, 'x') == ['A']
    assert mito.get_graph_axis_column_ids(graph_id, 'y') == ['B']
    assert not mito.get_is_graph_output_none(graph_id)


def test_all_styling_options():
    df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df)
    graph_id = '123'
    color = 'B'
    facet_col_column_id = 'A'
    facet_row_column_id = 'B'
    facet_col_wrap=2
    facet_col_spacing=.01
    facet_row_spacing=.01
    title_title='Custom Title'
    title_visible=False
    xaxis_title="Custom X Axis Title"
    xaxis_visible=False
    xaxis_type='category'
    xaxis_showgrid=False
    xaxis_gridwidth=5
    xaxis_rangeslider_visible=False
    yaxis_title="Custom Y Axis Title"
    yaxis_visible=False
    yaxis_type='linear'
    yaxis_showgrid=False
    yaxis_gridwidth=5
    showlegend=False    
    legend_title_text="Custom Legend Title"
    legend_orientation='v'
    legend_x=1
    legend_y=1
    paper_bgcolor='#FFCCDD'    
    plot_bgcolor='#FFCCEE'    
    title_font_color='#CCCCEE'    
    xaxis_title_font_color='#DDCCEE'    
    yaxis_title_font_color='#EECCEE'    

    mito.generate_graph(
        graph_id, BAR, 0, 
        False, 
        ['A'], ['B'], 
        400, 400, 
        color,
        facet_col_column_id=facet_col_column_id,
        facet_row_column_id=facet_row_column_id,
        facet_col_wrap=facet_col_wrap,
        facet_col_spacing=facet_col_spacing,
        facet_row_spacing=facet_row_spacing,
        title_title=title_title,
        title_visible=title_visible,
        xaxis_title=xaxis_title,
        xaxis_visible=xaxis_visible,
        xaxis_type=xaxis_type,
        xaxis_showgrid=xaxis_showgrid,
        xaxis_gridwidth=xaxis_gridwidth,
        xaxis_rangeslider_visible=xaxis_rangeslider_visible,
        yaxis_title=yaxis_title,
        yaxis_visible=yaxis_visible,
        yaxis_type=yaxis_type,
        yaxis_showgrid=yaxis_showgrid,
        yaxis_gridwidth=yaxis_gridwidth,
        showlegend=showlegend,
        legend_title_text=legend_title_text,
        legend_orientation=legend_orientation,
        legend_x=legend_x,
        legend_y=legend_y,
        paper_bgcolor=paper_bgcolor,
        plot_bgcolor=plot_bgcolor,
        title_font_color=title_font_color,
        xaxis_title_font_color=xaxis_title_font_color,
        yaxis_title_font_color=yaxis_title_font_color
    )

    assert len(mito.steps_including_skipped) == 2
    assert mito.curr_step.step_type == 'graph'

    assert mito.get_graph_type(graph_id) == BAR
    assert mito.get_graph_sheet_index(graph_id) == 0
    assert mito.get_graph_axis_column_ids(graph_id, 'x') == ['A']
    assert mito.get_graph_axis_column_ids(graph_id, 'y') == ['B']
    assert mito.get_graph_color(graph_id) == color
    assert mito.get_graph_facet_col_column_id(graph_id) == facet_col_column_id
    assert mito.get_graph_facet_row_column_id(graph_id) == facet_row_column_id
    assert mito.get_graph_facet_col_wrap(graph_id) == facet_col_wrap
    assert mito.get_graph_facet_col_spacing(graph_id) == facet_col_spacing
    assert mito.get_graph_facet_row_spacing(graph_id) == facet_row_spacing
    assert not mito.get_is_graph_output_none(graph_id)

    graph_styling_params = mito.get_graph_styling_params(graph_id)
    assert graph_styling_params['title']['title'] == title_title
    assert graph_styling_params['title']['visible'] == title_visible
    assert graph_styling_params['title']['title_font_color'] == title_font_color
    assert graph_styling_params['xaxis']['title'] == xaxis_title
    assert graph_styling_params['xaxis']['visible'] == xaxis_visible
    assert graph_styling_params['xaxis']['title_font_color'] == xaxis_title_font_color
    assert graph_styling_params['xaxis']['type'] == xaxis_type
    assert graph_styling_params['xaxis']['showgrid'] == xaxis_showgrid
    assert graph_styling_params['xaxis']['gridwidth'] == xaxis_gridwidth
    assert graph_styling_params['xaxis']['rangeslider']['visible'] == xaxis_rangeslider_visible
    assert graph_styling_params['yaxis']['title'] == yaxis_title
    assert graph_styling_params['yaxis']['visible'] == yaxis_visible
    assert graph_styling_params['yaxis']['title_font_color'] == yaxis_title_font_color
    assert graph_styling_params['yaxis']['type'] == yaxis_type
    assert graph_styling_params['yaxis']['showgrid'] == yaxis_showgrid
    assert graph_styling_params['yaxis']['gridwidth'] == yaxis_gridwidth
    assert graph_styling_params['showlegend'] == showlegend
    assert graph_styling_params['legend']['title']['text'] == legend_title_text
    assert graph_styling_params['legend']['orientation'] == legend_orientation
    assert graph_styling_params['legend']['x'] == legend_x
    assert graph_styling_params['legend']['y'] == legend_y
    assert graph_styling_params['paper_bgcolor'] == paper_bgcolor
    assert graph_styling_params['plot_bgcolor'] == plot_bgcolor


