
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import inspect
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

from IPython import get_ipython
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.step_performers.import_steps.dataframe_import_code_chunk import \
    DataframeImportCodeChunk
from mitosheet.errors import make_dataframe_not_found_error
from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param


def get_variable_with_name_from_caller(variable_name: str) -> Optional[Any]:
    """
    This helper function tries to find a variable with in the calling context. 
    It will first check ipython to see if it is defined, and get the variable
    from this context. 

    If ipython is not defined, it will assume we are in some other python environment,
    and attempt to get the variable from the callers stack frames.

    This is useful so that we can test this function (e.g. pytest does not run in
    an ipython environment).
    """
    ipython = get_ipython() # type: ignore
    if ipython is not None:
        return ipython.ev(variable_name)

    stack = inspect.stack()
    for s in reversed(stack):
        local_var = s[0].f_locals.get(variable_name)
        if local_var is not None:
            return local_var
            
        global_var = s[0].f_globals.get(variable_name)
        if global_var is not None:
            return global_var

    return None

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

        for df_name in df_names:
            try:
                df = get_variable_with_name_from_caller(df_name)
            except NameError:
                raise make_dataframe_not_found_error(df_name)

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
        return [
            DataframeImportCodeChunk(
                prev_state, 
                post_state, 
                'Imported Dataframes',
                'Imported dataframes into the mitosheet'
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
    