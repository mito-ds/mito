#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pandas as pd
from mitosheet.step_performers.graph_steps.graph_utils import BAR
from mitosheet.tests.test_utils import create_mito_wrapper

def test_delete_graph():
    df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3]})
    mito = create_mito_wrapper(df)
    graph_id = '123'
    mito.generate_graph(graph_id, BAR, 0, False, ['A'], ['B'], 400, 400)

    # Then delete the graph
    mito.delete_graph(graph_id)

    assert len(mito.steps_including_skipped) == 3
    assert mito.curr_step.step_type == 'graph_delete'

    graph_data = mito.get_graph_data(graph_id)
    assert len(graph_data) == 0