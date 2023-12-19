
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import traceback
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd

from mitosheet.ai.recon import update_state_by_reconing_dataframes
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.user_defined_edit_code_chunk import \
    UserDefinedEditCodeChunk
from mitosheet.errors import MitoError
from mitosheet.state import State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils.user_defined_function_utils import \
    get_user_defined_function_param_type_and_execute_value_and_transpile_value
from mitosheet.step_performers.utils.utils import get_param


class UserDefinedEditStepPerformer(StepPerformer):
    """
    Allows the user to make an edit to a dataframe with with a user 
    defined function.
    """

    @classmethod
    def step_version(cls) -> int:
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'user_defined_edit'

    @classmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:

        edit_name: str = get_param(params, 'edit_name')
        edit_params: Any = get_param(params, 'edit_params')
        
        # We make a new state to modify it
        post_state = prev_state.copy() # TODO: update the deep copies

        pandas_start_time = perf_counter()

        try:
            edit_function = next(f for f in post_state.user_defined_editors if f.__name__ == edit_name)
        except:
            raise MitoError(
                'user_defined_importer_not_found',
                f"Importer {edit_name} not found.",
                f"User defined importer {edit_name} not found. Please check that it is defined in the `editors` list passed to mitosheet.sheet.",
                error_modal=True
            )
        
        user_defined_function_params = get_user_defined_function_param_type_and_execute_value_and_transpile_value(post_state, edit_function, edit_params)
    
        try:
            result = edit_function(**{param_name: execute_param for param_name, (_, execute_param, _) in user_defined_function_params.items()})
        except:
            traceback_final_line = traceback.format_exc().splitlines()[-1]

            raise MitoError(
                'user_defined_editor_error',
                f"Editor {edit_name} raised an error.",
                f"User defined editor {edit_name} raised an error: {traceback_final_line}",
                error_modal=False
            )

        if not isinstance(result, pd.DataFrame):
            raise MitoError(
                'user_defined_editor_error',
                f"Editor {edit_name} raised an error.",
                f"User defined editor {edit_name} must return a single pandas dataframe. Instead it returned a result of type {type(result)}",
                error_modal=False
            )
        
        # Find the single dataframe param - so that we can get the sheet index for transpilation and updating the state
        df_names = {transpiled_param for _, (param_type, _, transpiled_param) in user_defined_function_params.items() if param_type == 'DataFrame'}
        if len(df_names) != 1:
            raise ValueError(
                f'Please ensure the editor {edit_name} takes a single dataframe as input. Otherwise, Mito cannot detect which dataframe you are editing.'
            )
        
        sheet_index = post_state.df_names.index(df_names.pop())
        post_state, _ = update_state_by_reconing_dataframes(post_state, sheet_index, post_state.dfs[sheet_index], result)

        pandas_processing_time = perf_counter() - pandas_start_time

        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            'sheet_index': sheet_index,
            'user_defined_function_params': user_defined_function_params,
        }

    @classmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        return [
            UserDefinedEditCodeChunk(
                prev_state, 
                get_param(params, 'edit_name'),
                get_param(execution_data if execution_data is not None else dict(), 'sheet_index'),
                get_param(execution_data if execution_data is not None else dict(), 'user_defined_function_params')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        # TODO: we could improve this ideally, but for now we return everything
        return set()
    