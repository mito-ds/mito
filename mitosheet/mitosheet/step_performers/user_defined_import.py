
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.user_defined_import_code_chunk import \
    UserDefinedImportCodeChunk
from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
from mitosheet.types import ColumnID


class UserDefinedImportStepPerformer(StepPerformer):
    """
    Allows a user to use one of the user_defined_importers.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'user_defined_import'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        print("PARAMS", params)
        importer: str = get_param(params, 'importer')

        # We make a new state to modify it
        post_state = prev_state.copy()

        pandas_start_time = perf_counter()
        
        print("NAMES", importer, post_state.user_defined_importers, [f.__name__ for f in post_state.user_defined_importers])
        importer_function = next(f for f in post_state.user_defined_importers if f.__name__ == importer)
        result = importer_function()

        if isinstance(result, pd.DataFrame):
            new_dfs = [result]
        elif isinstance(result, list):
            new_dfs = result
        else:
            raise Exception(f"User defined importer {importer} must return a pandas dataframe or a list of pandas dataframes.")

        for df in new_dfs:
            post_state.add_df_to_state(
                df,
                DATAFRAME_SOURCE_IMPORTED,
            )

        pandas_processing_time = perf_counter() - pandas_start_time


        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'result': {
                'num_new_dfs': len(new_dfs),
            }
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
            UserDefinedImportCodeChunk(
                prev_state, 
                post_state, 
                get_param(params, 'importer'),
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
    