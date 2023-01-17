#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.concat_code_chunk import ConcatCodeChunk
from mitosheet.state import DATAFRAME_SOURCE_CONCAT, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param


class ConcatStepPerformer(StepPerformer):
    """
    Allows you to concatenate two or more dataframes together.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'concat'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:

        join = get_param(params, 'join') # inner | outter
        ignore_index: bool = get_param(params, 'ignore_index')
        sheet_indexes: List[int] = get_param(params, 'sheet_indexes')

        post_state = prev_state.copy()

        to_concat = [post_state.dfs[sheet_index] for sheet_index in sheet_indexes]

        if len(to_concat) == 0:
            new_df = pd.DataFrame()
            pandas_processing_time = 0.0
        else:
            pandas_start_time = perf_counter()
            new_df = pd.concat(to_concat, join=join, ignore_index=ignore_index)
            pandas_processing_time = perf_counter() - pandas_start_time

        # Add this dataframe to the new post state
        post_state.add_df_to_state(new_df, DATAFRAME_SOURCE_CONCAT)

        return post_state, {
            'pandas_processing_time': pandas_processing_time
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            ConcatCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'join'),
                get_param(params, 'ignore_index'),
                get_param(params, 'sheet_indexes'),
            )
        ]
    
    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
