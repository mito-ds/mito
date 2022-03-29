#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.types import GraphID


class GraphDeleteStepPerformer(StepPerformer):
    """
    Deletes a graph from everywhere in the step.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'graph_delete'

    @classmethod
    def step_display_name(cls) -> str:
        return 'Deleted a Graph'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        graph_id = params['graph_id']
        old_graph_tab_name = prev_state.graph_data_dict[graph_id]
        params['old_graph_tab_name'] = old_graph_tab_name
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        graph_id: GraphID,
        old_graph_tab_name: str,
        **params
    ) -> Tuple[State, Optional[Dict[str, Any]]]:

        # Create a new step and save the parameters
        post_state = prev_state.copy()

        # Execute the graph delete
        del post_state.graph_data_dict[graph_id]

        return post_state, {
            'pandas_processing_time': 0 # No time spent on pandas, only metadata changes
        }

    @classmethod
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        graph_id: GraphID,
        old_graph_tab_name: str
    ) -> List[str]:
        # Since we don't generate any code for graphs, don't return any transpiled code.
        return []

    @classmethod
    def describe( # type: ignore
        cls,
        graph_id: GraphID,
        old_graph_tab_name: str,
        df_names=None,
        **params
    ) -> str:
        return f'Deleted {old_graph_tab_name}'
    
    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        graph_id: GraphID,
        **params
    ) -> Set[int]:
        return {-1}
