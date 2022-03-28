#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy, deepcopy
from typing import Any, Dict, List, Optional, Set, Tuple
import uuid

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.types import GraphID


class GraphDuplicateStepPerformer(StepPerformer):
    """
    This steps duplicates a graph of a given graphID. 
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'graph_duplicate'

    @classmethod
    def step_display_name(cls) -> str:
        return 'Duplicated a Graph'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        old_graph_id: GraphID,
        new_graph_id: GraphID,
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:
        post_state = prev_state.copy()

        # Execute the step
        graph_copy = deepcopy(post_state.graph_data_dict[old_graph_id])
        # We don't need to insist the the graph names are unique because they are just used in 
        # the sheet tab display. They aren't used in generated code or to identify graphs in the steps
        graph_copy["graphTabName"] = graph_copy["graphTabName"] + '_copy'
        
        # Add the duplicated graph to the graph_data
        post_state.graph_data_dict[new_graph_id] = graph_copy
        
        return post_state, {
            'pandas_processing_time': 0 # No time spent on pandas, only metadata changes
        }

    @classmethod
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        old_graph_id: GraphID,
        new_graph_id: GraphID,
    ) -> List[str]:
        # Graph steps don't add any generated code to the analysis script. 
        return []

    @classmethod
    def describe( # type: ignore
        cls,
        old_graph_id: GraphID,
        new_graph_id: GraphID,
        df_names=None,
        **params
    ) -> str:
        return f'Duplicated a Graph'
    
    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        old_graph_id: GraphID,
        new_graph_id: GraphID,
        **params
    ) -> Set[int]:
        return {-1}
