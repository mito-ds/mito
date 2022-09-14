
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.empty_code_chunk import EmptyCodeChunk

from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param

class DataframeImportStepPerformer(StepPerformer):
    """
    Allows you to import a dataframe
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'dataframe_import'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        df_names: str = get_param(params, 'df_names')

        # We make a new state to modify it
        post_state = prev_state.copy()

        pandas_start_time = perf_counter()
        
        # Get the dataframe, and import it
        from IPython import get_ipython
        ipython = get_ipython()
        for df_name in df_names:
            df = ipython.ev(df_name)
            # TODO: There is a bug if you import the same dataframe twice, then you get
            # issues where the generated code does not match with the sheet. Do we want 
            # to insist on uniqueness here? Or do we want to automatically make a copy?
            post_state.add_df_to_state(df, DATAFRAME_SOURCE_IMPORTED, df_name=df_name)
        
        pandas_processing_time = perf_counter() - pandas_start_time


        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'result': {}
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        post_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        # We don't need a code chunk here, as this isn't creating anything new. It's just putting this
        # dataframe inside the mitosheet state
        return [
            EmptyCodeChunk(
                prev_state, 
                post_state, 
                {
                    'display_name': 'Imported Dataframes',
                    'description_comment': 'Imported dataframes into the mitosheet',
                },
                execution_data
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
    