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

    assert len(mito.steps) == 2
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

    assert len(mito.steps) == 2
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

    title_title='Custom Title'
    title_visible=False
    xaxis_title="Custom X Axis Title"
    xaxis_visible=False
    xaxis_rangeslider_visible=False
    yaxis_title="Custom Y Axis Title"
    yaxis_visible=False
    showlegend=False    

    mito.generate_graph(
        graph_id, BAR, 0, 
        False, 
        ['A'], ['B'], 
        400, 400, 
        title_title=title_title,
        title_visible=title_visible,
        xaxis_title=xaxis_title,
        xaxis_visible=xaxis_visible,
        xaxis_rangeslider_visible=xaxis_rangeslider_visible,
        yaxis_title=yaxis_title,
        yaxis_visible=yaxis_visible,
        showlegend=showlegend
    )

    assert len(mito.steps) == 2
    assert mito.curr_step.step_type == 'graph'

    assert mito.get_graph_type(graph_id) == BAR
    assert mito.get_graph_sheet_index(graph_id) == 0
    assert mito.get_graph_axis_column_ids(graph_id, 'x') == ['A']
    assert mito.get_graph_axis_column_ids(graph_id, 'y') == ['B']
    assert not mito.get_is_graph_output_none(graph_id)

    graph_styling_params = mito.get_graph_styling_params(graph_id)
    assert graph_styling_params['title_title'] == title_title
    assert graph_styling_params['title_visible'] == title_visible
    assert graph_styling_params['xaxis_title'] == xaxis_title
    assert graph_styling_params['xaxis_visible'] == xaxis_visible
    assert graph_styling_params['xaxis_rangeslider_visible'] == xaxis_rangeslider_visible
    assert graph_styling_params['yaxis_title'] == yaxis_title
    assert graph_styling_params['yaxis_visible'] == yaxis_visible
    assert graph_styling_params['showlegend'] == showlegend


