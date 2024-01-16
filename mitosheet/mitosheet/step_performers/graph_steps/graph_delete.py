#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.empty_code_chunk import EmptyCodeChunk
from mitosheet.state import State
from mitosheet.step_performers.graph_steps.graph_utils import get_graph_index_by_graph_id
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.utils import get_param
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
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        graph_id: GraphID = get_param(params, 'graph_id')

        post_state = prev_state.copy()

        graph_index = get_graph_index_by_graph_id(post_state.graph_data_array, graph_id)
        del post_state.graph_data_array[graph_index]

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
                'Deleted graph',
                'Deleted a graph',
            )
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
