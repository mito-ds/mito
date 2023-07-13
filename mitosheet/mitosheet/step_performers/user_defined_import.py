
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from time import perf_counter
import traceback
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

import pandas as pd

from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.code_chunks.user_defined_import_code_chunk import \
    UserDefinedImportCodeChunk
from mitosheet.errors import MitoError
from mitosheet.state import DATAFRAME_SOURCE_IMPORTED, State
from mitosheet.step_performers.step_performer import StepPerformer
from mitosheet.step_performers.utils import get_param
import inspect

from mitosheet.types import UserDefinedImporterParamType


def get_user_defined_importer_param_type(f: Callable, param_name: str) -> UserDefinedImporterParamType:

    parameters = inspect.signature(f).parameters
    param_type = parameters[param_name].annotation

    if param_type == str:
        return 'str'
    elif param_type == int:
        return 'int'
    elif param_type == float:
        return 'float'
    elif param_type == bool:
        return 'bool'
    else:
        return 'any'


def get_param_names_to_types_for_importer(f: Callable) -> Dict[str, UserDefinedImporterParamType]:
    param_names_to_types = {}

    for name in inspect.signature(f).parameters:
        param_names_to_types[name] = get_user_defined_importer_param_type(f, name)

    return param_names_to_types

def get_user_defined_importers_for_frontend(state: Optional[State]) -> List[Any]:
    if state is None:
        return []

    return [
        {
            'name': f.__name__,
            'docstring': f.__doc__,
            'parameters': get_param_names_to_types_for_importer(f),
        }
        for f in state.user_defined_importers
    ]

def get_importer_params_and_type_and_value(f: Callable, frontend_params: Dict[str, str]) -> Dict[str, Tuple[UserDefinedImporterParamType, str]]:
    importer_params_and_type_and_value = {}

    for param_name, param_value in frontend_params.items():
        param_type = get_user_defined_importer_param_type(f, param_name)
        importer_params_and_type_and_value[param_name] = (param_type, param_value)
    
    return importer_params_and_type_and_value


def get_user_defined_importer_params_from_frontend_params(f: Callable, frontend_params: Dict[str, str]) -> Dict[str, Any]:
    user_defined_importer_params: Dict[str, Any] = {}

    for param_name, (param_type, param_value) in get_importer_params_and_type_and_value(f, frontend_params).items():
        try:
            if param_type == 'str':
                user_defined_importer_params[param_name] = param_value
            elif param_type == 'int':
                user_defined_importer_params[param_name] = int(param_value)
            elif param_type == 'float':
                user_defined_importer_params[param_name] = float(param_value)
            elif param_type == 'bool':
                user_defined_importer_params[param_name] = 'true' in param_value.lower()
            else:
                try:
                    user_defined_importer_params[param_name] = eval(param_value)
                except:
                    # If we cannot eval the result, it's likely a string, so we just pass it through
                    user_defined_importer_params[param_name] = param_value
        except:
            raise MitoError(
                'user_defined_importer_error',
                f"Importer {f.__name__} raised an error.",
                f"Parameter {param_name} with value {param_value} cannot be cast to type {param_type}. Please insert an appropriate value.",
                error_modal=False
            )

    return user_defined_importer_params



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
        
        user_defined_importer_params = get_user_defined_importer_params_from_frontend_params(importer_function, importer_params)
    
        try:
            result = importer_function(**user_defined_importer_params)
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
            'user_defined_importer_params': user_defined_importer_params,
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
                get_param(execution_data if execution_data is not None else dict(), 'user_defined_importer_params')
            )
        ]

    @classmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        return {-1}
    