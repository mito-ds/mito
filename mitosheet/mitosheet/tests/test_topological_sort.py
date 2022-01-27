#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

import pytest
from copy import deepcopy

from ..errors import MitoError
from ..topological_sort import topological_sort_columns, creates_circularity

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
