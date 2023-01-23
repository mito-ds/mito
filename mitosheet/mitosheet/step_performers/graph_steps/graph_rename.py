#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import copy
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.empty_code_chunk import EmptyCodeChunk

from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import GraphID


class GraphRenameStepPerformer(StepPerformer):
    """"
    A rename graph step changes the name of a specific graph id
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'graph_rename'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        graph_id = params['graph_id']
        old_graph_tab_name = prev_state.graph_data_dict[graph_id]["graphTabName"]
        params['old_graph_tab_name'] = old_graph_tab_name
        return params

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        graph_id: GraphID = get_param(params, 'graph_id')
        old_graph_tab_name: str = get_param(params, 'old_graph_tab_name')
        new_graph_tab_name: str = get_param(params, 'new_graph_tab_name')

        # Bail early, if there is no change or the new name is empty
        if old_graph_tab_name == new_graph_tab_name or new_graph_tab_name == '' :
            return prev_state, None

        # Create a new step and save the parameters
        post_state = prev_state.copy()

        post_state.graph_data_dict[graph_id]["graphTabName"] = new_graph_tab_name
        
        return post_state, {
            'pandas_processing_time': 0 # No time spent on pandas, only metadata changes
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:

        # Graph steps don't add any generated code to the analysis script. 
        return [
            EmptyCodeChunk(
                prev_state, 
                post_state, 
                'Renamed graph',
                'Renamed a graph',
            )
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}