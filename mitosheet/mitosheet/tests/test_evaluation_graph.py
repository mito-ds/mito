#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import pytest
from copy import deepcopy

import pandas as pd
from mitosheet.errors import MitoError
from mitosheet.evaluation_graph_utils import create_column_evaluation_graph, topological_sort_columns, creates_circularity
from mitosheet.tests.test_utils import create_mito_wrapper_dfs

def test_create_column_evaluation_graph():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df)
    mito.set_formula('=A', 0, 'B', add_column=True)
    mito.set_formula('=B', 0, 'C', add_column=True)

    assert create_column_evaluation_graph(
        mito.curr_step.post_state,
        0
    ) == {'A': {'B'}, 'B': {'C'}, 'C': set()}

def test_create_column_evaluation_graph_complex():
    df = pd.DataFrame({'A': [123]})
    mito = create_mito_wrapper_dfs(df)
    mito.set_formula('=A', 0, 'AAAA', add_column=True)
    mito.set_formula('=AAAA', 0, 'C', add_column=True)
    mito.set_formula('=AAAA + C', 0, 'D', add_column=True)

    assert create_column_evaluation_graph(
        mito.curr_step.post_state,
        0
    ) == {'A': {'AAAA'}, 'AAAA': {'C', 'D'}, 'C': {'D'}, 'D': set()}


# Test circularity detection works

def test_creates_circularity_self_reference():
    column_evaluation_graph = {'A': set([]), 'B': set([]), 'C': set([])}
    should_not_modify = deepcopy(column_evaluation_graph)
    assert creates_circularity(should_not_modify, 'A', [], ['A'])
    assert column_evaluation_graph == should_not_modify

def test_creates_circularity_intermediate_reference():
    column_evaluation_graph = {'A': set(['B']), 'B': set(['C']), 'C': set([])}
    should_not_modify = deepcopy(column_evaluation_graph)
    assert creates_circularity(should_not_modify, 'A', [], ['C'])
    assert column_evaluation_graph == should_not_modify

def test_creates_no_circularity_intermediate_linear():
    column_evaluation_graph = {'A': set(['B']), 'B': set([]), 'C': set([])}
    should_not_modify = deepcopy(column_evaluation_graph)
    assert not creates_circularity(should_not_modify, 'C', [], ['B'])
    assert column_evaluation_graph == should_not_modify

# Test toplogical sort itself

def test_no_cell_relationships_no_error():
    column_evaluation_graph = {'A': set([]), 'B': set([]), 'C': set([])}
    topological_sort_columns(column_evaluation_graph)

def test_simple_linear_topological_sort():
    column_evaluation_graph = {'A': set(['B']), 'B': set(['C']), 'C': set([])}
    sort = topological_sort_columns(column_evaluation_graph)
    assert sort == ['A', 'B', 'C']

def test_simple_linear_topological_sort_options():
    column_evaluation_graph = {'A': set(['B']), 'B': set([]), 'C': set([])}
    sort = topological_sort_columns(column_evaluation_graph)
    assert (sort == ['A', 'B', 'C'] or sort == ['A', 'C', 'B'] or sort == ['C', 'A', 'B'])

def test_out_of_order_topological_sort_options():
    column_evaluation_graph = {
        'A': set([]), 
        'B': set(['A']), 
        'C': set(['A'])
    }
    sort = topological_sort_columns(column_evaluation_graph)
    assert (sort == ['C', 'B', 'A'] or sort == ['B', 'C', 'A'])

def test_out_of_order_linear_topological_sort_options():
    column_evaluation_graph = {
        'A': set([]), 
        'B': set(['A']), 
        'C': set(['B'])
    }
    sort = topological_sort_columns(column_evaluation_graph)
    assert sort == ['C', 'B', 'A']

def test_strong_linear_order():
    column_evaluation_graph = {
        'A': set(['B', 'C']), 
        'B': set(['C']), 
        'C': set([])
    }
    sort = topological_sort_columns(column_evaluation_graph)
    assert sort == ['A', 'B', 'C']

# Errors with cyles

def test_simple_cycle_is_cycle_error():
    column_evaluation_graph = {'A': set(['B']), 'B': set(['C']), 'C': set(['A'])}
    with pytest.raises(MitoError) as edit_error_info:
        sort = topological_sort_columns(column_evaluation_graph)
    assert edit_error_info.value.type_ == 'circular_reference_error'

def test_self_reference_is_cycle_error():
    column_evaluation_graph = {'A': set(['B']), 'B': set(['C']), 'C': set(['C'])}
    with pytest.raises(MitoError) as edit_error_info:
        sort = topological_sort_columns(column_evaluation_graph)
    assert edit_error_info.value.type_ == 'circular_reference_error'

def test_simple_nested_cycle_is_cycle_error():
    column_evaluation_graph = {'A': set(['B']), 'B': set(['C']), 'C': set(['B'])}
    with pytest.raises(MitoError) as edit_error_info:
        sort = topological_sort_columns(column_evaluation_graph)
    assert edit_error_info.value.type_ == 'circular_reference_error'
