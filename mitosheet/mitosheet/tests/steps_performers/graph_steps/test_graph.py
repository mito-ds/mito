#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pandas as pd
import pytest
from mitosheet.step_performers.graph_steps.graph_utils import BAR, BOX, HISTOGRAM, SCATTER
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

GRAPH_CREATION_TESTS = [
    (BAR),
    (BOX),
    (HISTOGRAM),
    (SCATTER)
]

@pytest.mark.parametrize("graph_type", GRAPH_CREATION_TESTS)
def test_create_graph_bar(graph_type):
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
    assert mito.get_is_graph_output_none(graph_id) == False


