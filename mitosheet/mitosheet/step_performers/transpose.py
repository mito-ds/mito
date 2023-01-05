
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.transpose_code_chunk import TransposeCodeChunk

from mitosheet.state import DATAFRAME_SOURCE_TRANSPOSED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID
from mitosheet.utils import get_first_unused_dataframe_name

class TransposeStepPerformer(StepPerformer):
    """
    Allows you to transpose.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'transpose'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        sheet_index: int = get_param(params, 'sheet_index')

        # We make a new state to modify it
        post_state = prev_state.copy()

        pandas_start_time = perf_counter()
        new_df = post_state.dfs[sheet_index].T
        pandas_processing_time = perf_counter() - pandas_start_time

        new_df_name = get_first_unused_dataframe_name(post_state.df_names, f'{post_state.df_names[sheet_index]}_transposed')
        post_state.add_df_to_state(new_df, DATAFRAME_SOURCE_TRANSPOSED, df_name=new_df_name)

        return post_state, {
            'pandas_processing_time': pandas_processing_time,
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
            TransposeCodeChunk(prev_state, post_state, get_param(params, 'sheet_index'))
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
    