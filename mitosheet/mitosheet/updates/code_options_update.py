#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
After reading in the arguments passed to the frontend,
this update figures out which of them were dataframes
and which of them were file paths, and updates the 
df names in the steps properly.
"""

from copy import deepcopy
from typing import List
from mitosheet.types import CodeOptions, StepsManagerType
from mitosheet.utils import get_valid_python_identifier

CODE_OPTIONS_UPDATE_EVENT = 'code_options_update'
CODE_OPTIONS_UPDATE_PARAMS = ['code_options']

def execute_args_update(
        steps_manager: StepsManagerType,
        code_options: CodeOptions
    ) -> None:

    # Get the valid function names
    valid_function_name = get_valid_python_identifier(code_options['function_name'], 'function', 'func_')
    final_code_options = deepcopy(code_options)
    final_code_options['function_name'] = valid_function_name

    # Get valid parameter names, and make sure they are unique -- we only do this if it's a dict
    valid_parameter_names: List[str] = []
    function_params = code_options['function_params']
    if isinstance(function_params, dict):
        final_function_params = deepcopy(function_params)
        for parameter_name, parameter_value in function_params.items():
            valid_parameter_name = get_valid_python_identifier(parameter_name, 'parameter', 'param_')
            if valid_parameter_name in valid_parameter_names:
                i = 1
                while valid_parameter_name in valid_parameter_names:
                    valid_parameter_name = f"{get_valid_python_identifier(parameter_name, 'parameter', 'param_')}_{i}"
                    i += 1

            del final_function_params[parameter_name]
            final_function_params[valid_parameter_name] = parameter_value
            valid_parameter_names.append(valid_parameter_name)
        
        final_code_options['function_params'] = function_params

    steps_manager.code_options = final_code_options

CODE_OPTIONS_UPDATE = {
    'event_type': CODE_OPTIONS_UPDATE_EVENT,
    'params': CODE_OPTIONS_UPDATE_PARAMS,
    'execute': execute_args_update
}