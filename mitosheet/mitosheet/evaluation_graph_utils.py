#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains function for running a topological sort on a graph with
the representation {node: set(adj nodes)}. Note that all
nodes must be in the graph, even if they have no adj nodes, and
should just have an empty set in this case.
"""
from copy import deepcopy
from typing import Collection, Dict, List, Set


from mitosheet.errors import MitoError, make_circular_reference_error
from mitosheet.parser import parse_formula
from mitosheet.state import State
from mitosheet.types import ColumnID


def create_column_evaluation_graph(post_state: State, sheet_index: int) -> Dict[ColumnID, Set[ColumnID]]:
    """
    Returns a dict from column id -> the other column ids that have formulas
    that depend on that column id.
    """
    column_spreadsheet_code = post_state.column_spreadsheet_code[sheet_index]
    column_headers = post_state.dfs[sheet_index].keys()
    all_column_ids = post_state.column_ids.get_column_ids(sheet_index)

    column_evaluation_graph: Dict[ColumnID, Set[ColumnID]] = {column_id: set() for column_id in all_column_ids}

    for column_id, spreadsheet_code in column_spreadsheet_code.items():
        column_header = post_state.column_ids.get_column_header_by_id(sheet_index, column_id)
        _, _, dependencies = parse_formula(
            spreadsheet_code, 
            column_header,
            column_headers
        )

        dependencies_column_ids = post_state.column_ids.get_column_ids(sheet_index, dependencies)

        for dependency_column_ids in dependencies_column_ids:
            if dependency_column_ids not in column_evaluation_graph:
                column_evaluation_graph[dependency_column_ids] = set()
            column_evaluation_graph[dependency_column_ids].add(column_id)

    return column_evaluation_graph



def visit(column_evaluation_graph: Dict[ColumnID, Set[ColumnID]], node: ColumnID, visited: Dict[ColumnID, bool], finished_order: List[ColumnID], visited_loop: Set[ColumnID]) -> None:
    """
    Recursive helper function for topological sort. Throws a
    circular_reference_error if there is a loop.
    """
    # Mark the node as visited
    visited[node] = True

    # And record we visited it during this tree of calls to visit
    visited_loop.add(node)

    for adj_node in column_evaluation_graph[node]:
        if not visited[adj_node]:
            visit(column_evaluation_graph, adj_node, visited, finished_order, visited_loop)
        elif adj_node in visited_loop:
            # If we have visited this node in this subtree, there is a loop
            raise make_circular_reference_error()

    # Remove so we can visit again from elsewhere
    visited_loop.remove(node)
    # And mark this node as finished
    finished_order.append(node)


def topological_sort_columns(column_evaluation_graph: Dict[ColumnID, Set[ColumnID]]) -> List[ColumnID]:
    """
    Topologically sorts by DFSing the graph, recording the finish order, and
    then returning nodes in reversed finish order.
    """
    visited = {node: False for node in column_evaluation_graph}
    finish_order: List[ColumnID] = []
    # Visit each node in the graph
    for node in column_evaluation_graph:
        if not visited[node]:
            # Keep track of the nodes visited during this set
            # of recursive calls, so we can detect cycles
            visited_loop: Set[str] = set()
            visit(
                column_evaluation_graph,
                node,
                visited,
                finish_order,
                visited_loop
            )

    # Reverse finish order for DFS == topological sort
    finish_order.reverse()
    return finish_order

def subgraph_from_starting_column_id(column_evaluation_graph: Dict[ColumnID, Set[ColumnID]], starting_column_id: ColumnID) -> Dict[ColumnID, Set[ColumnID]]:
    """
    Filters down the column_evaluation_graph to just the nodes that can be reached
    from the starting_point, including the starting_point itself.

    This results in us transpiling less code, as we only transpile code that changes
    after a given starting column changes.
    """
    column_evaluation_subgraph = dict()

    nodes_in_subgraph = set([starting_column_id])
    while len(nodes_in_subgraph) > 0:
        curr_node = nodes_in_subgraph.pop()
        column_evaluation_subgraph[curr_node] = column_evaluation_graph[curr_node]
        nodes_in_subgraph.update(column_evaluation_subgraph[curr_node])

    return column_evaluation_subgraph

def topological_sort_dependent_columns(state: State, sheet_index: int, column_id: ColumnID) -> List[ColumnID]:
    """
    Returns a topological sort of all columns that are downstream of
    the passed column_id
    """
    column_evaluation_graph = create_column_evaluation_graph(state, sheet_index)
    subgraph = subgraph_from_starting_column_id(column_evaluation_graph, column_id)
    return topological_sort_columns(subgraph)

def creates_circularity(
        column_evaluation_graph: Dict[ColumnID, Set[ColumnID]],
        column_id: ColumnID,
        old_dependencies: Collection[ColumnID],
        new_dependencies: Collection[ColumnID]
    ) -> bool:
    """
    Given a column_evaluation_graph, checks if removing the
    old_dependencies and adding the new_dependencies to this
    column_id will introduce a circular reference.

    Returns False if there is not a circular reference, and returns
    True if there is a circular reference.
    """
    # Copy, so we don't modify
    _column_evaluation_graph = deepcopy(column_evaluation_graph)

    for old_dependency in old_dependencies:
        _column_evaluation_graph[old_dependency].remove(column_id)
    for new_dependency in new_dependencies:
        _column_evaluation_graph[new_dependency].add(column_id)

    try:
        # Errors if there is no toplogical sort possible
        topological_sort_columns(_column_evaluation_graph)

        return False
    except MitoError as e:
        # Reports this error
        return True
    except Exception as e:
        # TODO: handle this case with a general error?
        return True
