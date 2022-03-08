#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pandas as pd
from mitosheet.step_performers.graph_steps.graph_utils import BAR, BOX, HISTOGRAM, SCATTER
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

def test_create_graph_bar():
    df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df)
    graph_id = '123'
    mito.generate_graph(graph_id, BAR, 0, False, ['A'], ['B'], 400, 400)

    assert len(mito.steps) == 2
    assert mito.curr_step.step_type == 'graph'

    graph_data = mito.get_graph_data(graph_id)

    assert graph_data["graphParams"]["graphCreation"]["graph_type"] == 'bar'
    assert graph_data["graphParams"]["graphCreation"]["sheet_index"] == 0
    assert graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"] == ['A']
    assert graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"] == ['B']

    assert graph_data["graphOutput"]["graphScript"] is not None
    assert graph_data["graphOutput"]["graphHTML"] is not None
    assert graph_data["graphOutput"]["graphGeneratedCode"] is not None

def test_create_graph_box():
    df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df)
    graph_id = '123'
    mito.generate_graph(graph_id, BOX, 0, False, ['A'], ['B'], 400, 400)
    
    assert len(mito.steps) == 2
    assert mito.curr_step.step_type == 'graph'

    graph_data = mito.get_graph_data(graph_id)

    assert graph_data["graphParams"]["graphCreation"]["graph_type"] == 'box'
    assert graph_data["graphParams"]["graphCreation"]["sheet_index"] == 0
    assert graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"] == ['A']
    assert graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"] == ['B']

    assert graph_data["graphOutput"]["graphScript"] is not None
    assert graph_data["graphOutput"]["graphHTML"] is not None
    assert graph_data["graphOutput"]["graphGeneratedCode"] is not None

def test_create_graph_scatter():
    df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df)
    graph_id = '123'
    mito.generate_graph(graph_id, SCATTER, 0, False, ['A'], ['B'], 400, 400)
    
    assert len(mito.steps) == 2
    assert mito.curr_step.step_type == 'graph'

    graph_data = mito.get_graph_data(graph_id)

    assert graph_data["graphParams"]["graphCreation"]["graph_type"] == 'scatter'
    assert graph_data["graphParams"]["graphCreation"]["sheet_index"] == 0
    assert graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"] == ['A']
    assert graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"] == ['B']

    assert graph_data["graphOutput"]["graphScript"] is not None
    assert graph_data["graphOutput"]["graphHTML"] is not None
    assert graph_data["graphOutput"]["graphGeneratedCode"] is not None

def test_create_graph_histogram():
    df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df)
    graph_id = '123'
    mito.generate_graph(graph_id, HISTOGRAM, 0, False, ['A'], [] , 400, 400)
    
    assert len(mito.steps) == 2
    assert mito.curr_step.step_type == 'graph'

    graph_data = mito.get_graph_data(graph_id)

    assert graph_data["graphParams"]["graphCreation"]["graph_type"] == 'histogram'
    assert graph_data["graphParams"]["graphCreation"]["sheet_index"] == 0
    assert graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"] == ['A']
    assert graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"] == []

    assert graph_data["graphOutput"]["graphScript"] is not None
    assert graph_data["graphOutput"]["graphHTML"] is not None
    assert graph_data["graphOutput"]["graphGeneratedCode"] is not None



