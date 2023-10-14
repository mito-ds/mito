
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
from mitosheet.step_performers.utils.utils import get_param
from mitosheet.step_performers.utils.user_defined_function_utils import get_user_defined_function_param_type_and_execute_value_and_transpile_value


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
        importer_params: Dict[str, str] = get_param(params, 'importer_params')

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
        
        user_defined_function_params = get_user_defined_function_param_type_and_execute_value_and_transpile_value(post_state, importer_function, importer_params)
    
        try:
            result = importer_function(**{param_name: execute_value for param_name, (_, execute_value, _) in user_defined_function_params.items()})
        except:
            traceback_final_line = traceback.format_exc().splitlines()[-1]

            raise MitoError(
                'user_defined_importer_error',
                f"Importer {importer} raised an error.",
                f"User defined importer {importer} raised an error: {traceback_final_line}",
                error_modal=False
            )

        if not isinstance(result, pd.DataFrame):
            raise MitoError(
                'user_defined_importer_error',
                f"Importer {importer} raised an error.",
                f"User defined importer {importer} must return a single pandas dataframe. Instead it returned a result of type {type(result)}",
                error_modal=False
            )

        post_state.add_df_to_state(
            result,
            DATAFRAME_SOURCE_IMPORTED,
        )

        pandas_processing_time = perf_counter() - pandas_start_time


        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'user_defined_function_params': user_defined_function_params,
            'result': {
                'num_new_dfs': 1
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
                get_param(execution_data if execution_data is not None else dict(), 'user_defined_function_params')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
    