
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
import traceback
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.user_defined_import_code_chunk import \
    UserDefinedImportCodeChunk
from mitosheet.errors import MitoError
from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param


def get_user_defined_importers_for_frontend(state: Optional[State]) -> List[Any]:
    if state is None:
        return []

    return [
        {
            'name': f.__name__,
            'docstring': f.__doc__,
            'parameters': [],
        }
        for f in state.user_defined_importers
    ]


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
        importer: str = get_param(params, 'importer')

        # We make a new state to modify it
        post_state = prev_state.copy()

        pandas_start_time = perf_counter()
        
        try:
            importer_function = next(f for f in post_state.user_defined_importers if f.__name__ == importer)
        except:
            raise MitoError(
                'user_defined_importer_not_found',
                f"Importer {importer} not found.",
                f"User defined importer {importer} not found. Please check that it is defined in the `importers` list passed to mitosheet.sheet.",
                error_modal=True
            )
        
        try:
            result = importer_function()
        except:
            traceback_final_line = traceback.format_exc().splitlines()[-1]

            raise MitoError(
                'user_defined_importer_error',
                f"Importer {importer} raised an error.",
                f"User defined importer {importer} raised an error: {traceback_final_line}",
                error_modal=False
            )

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
    