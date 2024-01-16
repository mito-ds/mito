#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import pandas as pd
from mitosheet.step_performers.graph_steps.graph_utils import BAR, SCATTER
from mitosheet.tests.test_utils import create_mito_wrapper

# def test_duplicate_graph():
#     df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3]})
#     mito = create_mito_wrapper(df)
#     graph_id = '123'
#     mito.generate_graph(graph_id, BAR, 0, False, ['A'], ['B'], 400, 400)

#     # Then delete the graph
#     new_graph_id = '456'
#     mito.duplicate_graph(graph_id, new_graph_id)

#     assert len(mito.steps_including_skipped) == 3
#     assert mito.curr_step.step_type == 'graph_duplicate'

#     assert mito.get_graph_type(graph_id) == 'bar'
#     assert mito.get_graph_sheet_index(graph_id) == 0
#     assert mito.get_graph_axis_column_ids(graph_id, 'x') == ['A']
#     assert mito.get_graph_axis_column_ids(graph_id, 'y') == ['B']
#     assert mito.get_is_graph_output_none(graph_id) == False

#     assert mito.get_graph_type(new_graph_id) == 'bar'
#     assert mito.get_graph_sheet_index(new_graph_id) == 0
#     assert mito.get_graph_axis_column_ids(new_graph_id, 'x') == ['A']
#     assert mito.get_graph_axis_column_ids(new_graph_id, 'y') == ['B']
#     assert mito.get_is_graph_output_none(new_graph_id) == False



# def test_duplicate_graph_then_edit_each():
#     df = pd.DataFrame({'A': ['aaron', 'jake', 'nate'], 'B': [1, 2, 3], 'C': [1, 2, 3]})
#     mito = create_mito_wrapper(df)
#     graph_id = '123'
#     mito.generate_graph(graph_id, BAR, 0, False, ['A'], ['B'], 400, 400)

#     # Then delete the graph
#     new_graph_id = '456'
#     mito.duplicate_graph(graph_id, new_graph_id)

#     # Edit the original graph
#     mito.generate_graph(graph_id, SCATTER, 0, False, ['A'], ['B'], 400, 400)

#     # Make sure that only one graph was updated
#     assert mito.get_graph_type(graph_id) == 'scatter'
#     assert mito.get_graph_sheet_index(graph_id) == 0
#     assert mito.get_graph_axis_column_ids(graph_id, 'x') == ['A']
#     assert mito.get_graph_axis_column_ids(graph_id, 'y') == ['B']
#     assert mito.get_is_graph_output_none(graph_id) == False

#     assert mito.get_graph_type(new_graph_id) == 'bar'
#     assert mito.get_graph_sheet_index(new_graph_id) == 0
#     assert mito.get_graph_axis_column_ids(new_graph_id, 'x') == ['A']
#     assert mito.get_graph_axis_column_ids(new_graph_id, 'y') == ['B']
#     assert mito.get_is_graph_output_none(new_graph_id) == False

#     # Apply edit to second graph
#     mito.generate_graph(new_graph_id, BAR, 0, False, ['A'], ['B', 'C'], 400, 400)

#     # Make sure only second graph was edited 
#     assert mito.get_graph_type(graph_id) == 'scatter'
#     assert mito.get_graph_sheet_index(graph_id) == 0
#     assert mito.get_graph_axis_column_ids(graph_id, 'x') == ['A']
#     assert mito.get_graph_axis_column_ids(graph_id, 'y') == ['B']
#     assert mito.get_is_graph_output_none(graph_id) == False

#     assert mito.get_graph_type(new_graph_id) == 'bar'
#     assert mito.get_graph_sheet_index(new_graph_id) == 0
#     assert mito.get_graph_axis_column_ids(new_graph_id, 'x') == ['A']
#     assert mito.get_graph_axis_column_ids(new_graph_id, 'y') == ['B', 'C']
#     assert mito.get_is_graph_output_none(new_graph_id) == False



