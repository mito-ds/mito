#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pandas as pd
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

def test_create_graph():
    df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3]})
    mito = create_mito_wrapper_dfs(df)
    mito.generate_graph(
        {
            'safety_filter_turned_on_by_user': False
        },
        {
            'graph_type': 'bar',
            'sheet_index': 0,
            'x_axis_column_ids': ['A'],
            'y_axis_column_ids': ['B']
        },
        {},
        {
            'height': 400,
            'width': 400
        }
    )
    
    assert len(mito.steps) == 2
    assert mito.curr_step.step_type == 'graph'

    graph_data = mito.get_graph_data('0')

    assert graph_data["graphParams"]["graphCreation"]["graph_type"] == 'bar'
    assert graph_data["graphParams"]["graphCreation"]["sheet_index"] == 0
    assert graph_data["graphParams"]["graphCreation"]["x_axis_column_ids"] == ['A']
    assert graph_data["graphParams"]["graphCreation"]["y_axis_column_ids"] == ['B']

    assert graph_data["graphOutput"]["graphScript"] is not None
    assert graph_data["graphOutput"]["graphHTML"] is not None
    assert graph_data["graphOutput"]["graphGeneratedCode"] is not None


