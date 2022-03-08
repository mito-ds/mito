#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pandas as pd
from mitosheet.step_performers.graph_steps.graph_utils import BAR, SCATTER
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

def test_duplicate_graph():
    df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df)
    graph_id = '123'
    mito.generate_graph(graph_id, BAR, 0, False, ['A'], ['B'], 400, 400)

    # Then delete the graph
    new_graph_id = '456'
    mito.duplicate_graph(graph_id, new_graph_id)

    assert len(mito.steps) == 3
    assert mito.curr_step.step_type == 'graph_duplicate'

    old_graph_data = mito.get_graph_data(graph_id)

    assert old_graph_data["graphParams"]["graphCreation"]["graph_type"] == 'bar'
    assert old_graph_data["graphParams"]["graphCreation"]["sheet_index"] == 0
    assert old_graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"] == ['A']
    assert old_graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"] == ['B']

    assert old_graph_data["graphOutput"]["graphScript"] is not None
    assert old_graph_data["graphOutput"]["graphHTML"] is not None
    assert old_graph_data["graphOutput"]["graphGeneratedCode"] is not None

    new_graph_data = mito.get_graph_data(new_graph_id)

    assert new_graph_data["graphParams"]["graphCreation"]["graph_type"] == 'bar'
    assert new_graph_data["graphParams"]["graphCreation"]["sheet_index"] == 0
    assert new_graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"] == ['A']
    assert new_graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"] == ['B']

    assert new_graph_data["graphOutput"]["graphScript"] is not None
    assert new_graph_data["graphOutput"]["graphHTML"] is not None
    assert new_graph_data["graphOutput"]["graphGeneratedCode"] is not None


def test_duplicate_graph_then_edit_each():
    df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3], 'C': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df)
    graph_id = '123'
    mito.generate_graph(graph_id, BAR, 0, False, ['A'], ['B'], 400, 400)

    # Then delete the graph
    new_graph_id = '456'
    mito.duplicate_graph(graph_id, new_graph_id)

    # Edit the original graph
    mito.generate_graph(graph_id, SCATTER, 0, False, ['A'], ['B'], 400, 400)

    # Make sure that only one graph was updated
    old_graph_data = mito.get_graph_data(graph_id)

    assert old_graph_data["graphParams"]["graphCreation"]["graph_type"] == 'scatter'
    assert old_graph_data["graphParams"]["graphCreation"]["sheet_index"] == 0
    assert old_graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"] == ['A']
    assert old_graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"] == ['B']

    assert old_graph_data["graphOutput"]["graphScript"] is not None
    assert old_graph_data["graphOutput"]["graphHTML"] is not None
    assert old_graph_data["graphOutput"]["graphGeneratedCode"] is not None

    new_graph_data = mito.get_graph_data(new_graph_id)

    assert new_graph_data["graphParams"]["graphCreation"]["graph_type"] == 'bar'
    assert new_graph_data["graphParams"]["graphCreation"]["sheet_index"] == 0
    assert new_graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"] == ['A']
    assert new_graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"] == ['B']

    assert new_graph_data["graphOutput"]["graphScript"] is not None
    assert new_graph_data["graphOutput"]["graphHTML"] is not None
    assert new_graph_data["graphOutput"]["graphGeneratedCode"] is not None

    # Apply edit to second graph
    mito.generate_graph(new_graph_id, BAR, 0, False, ['A'], ['B', 'C'], 400, 400)

    # Make sure only second graph was edited 
    old_graph_data = mito.get_graph_data(graph_id)

    assert old_graph_data["graphParams"]["graphCreation"]["graph_type"] == 'scatter'
    assert old_graph_data["graphParams"]["graphCreation"]["sheet_index"] == 0
    assert old_graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"] == ['A']
    assert old_graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"] == ['B']

    assert old_graph_data["graphOutput"]["graphScript"] is not None
    assert old_graph_data["graphOutput"]["graphHTML"] is not None
    assert old_graph_data["graphOutput"]["graphGeneratedCode"] is not None

    new_graph_data = mito.get_graph_data(new_graph_id)

    assert new_graph_data["graphParams"]["graphCreation"]["graph_type"] == 'bar'
    assert new_graph_data["graphParams"]["graphCreation"]["sheet_index"] == 0
    assert new_graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"] == ['A']
    assert new_graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"] == ['B', 'C']

    assert new_graph_data["graphOutput"]["graphScript"] is not None
    assert new_graph_data["graphOutput"]["graphHTML"] is not None
    assert new_graph_data["graphOutput"]["graphGeneratedCode"] is not None



