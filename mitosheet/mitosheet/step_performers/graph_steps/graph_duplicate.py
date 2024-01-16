#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from copy import deepcopy
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.empty_code_chunk import EmptyCodeChunk
from mitosheet.state import State
from mitosheet.step_performers.graph_steps.graph_utils import get_graph_index_by_graph_id
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.types import GraphID


class GraphDuplicateStepPerformer(StepPerformer):
    """
    This steps duplicates a graph of a given graphID. 
    NOTE: WE ARE NOT USING THIS STEP IN THE CURRENT VERSION OF MITOSHEET. 
    The reason is that we separated the graph params and the graph data, 
    which caused graph duplication to not make sense as its own step. 
    Now, on the frontend we just get the graph params and send them to the backend
    as a new graph. We're keeping this around so that it doesn't break any analyses. 
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'graph_duplicate'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        old_graph_id: GraphID = get_param(params, 'old_graph_id')
        new_graph_id: GraphID = get_param(params, 'new_graph_id')

        post_state = prev_state.copy()
        graph_index = get_graph_index_by_graph_id(post_state.graph_data_array, old_graph_id)
        if (graph_index == -1):
            raise Exception(f'Graph with graph_id {old_graph_id} not found')
        graph_copy = deepcopy(post_state.graph_data_array[graph_index])
        graph_copy["graph_id"] = new_graph_id
        # We don't need to insist the the graph names are unique because they are just used in 
        # the sheet tab display. They aren't used in generated code or to identify graphs in the steps
        graph_copy["graph_tab_name"] = graph_copy["graph_tab_name"] + '_copy'        
        post_state.graph_data_array.append(graph_copy)
        
        return post_state, {
            'pandas_processing_time': 0 # No time spent on pandas, only metadata changes
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:

        # Graph steps don't add any generated code to the analysis script. 
        return [
            EmptyCodeChunk(
                prev_state, 
                'Duplicated graph',
                'Duplicated a graph',
            )
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
