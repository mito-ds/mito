#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict, List, Tuple
from mitosheet.code_chunks.code_chunk_utils import get_code_chunks
from mitosheet.types import ParamSubtype, ParamType, ParamName, ParamValue, StepsManagerType, ParamMetadata
from mitosheet.updates.args_update import is_string_arg_to_mitosheet_call
from mitosheet.transpiler.transpile_utils import get_final_function_params_with_subtypes_turned_to_parameters

def get_parameterizable_params(params: Dict[str, Any], steps_manager: StepsManagerType) -> List[Tuple[ParamValue, ParamType, ParamSubtype]]:

        all_parameterizable_params: List[Tuple[ParamValue, ParamType, ParamSubtype]] = []

        # First, get the original arguments to the mitosheet - we only let you parameterize df names for now
        for arg in steps_manager.original_args_raw_strings:
                if not is_string_arg_to_mitosheet_call(arg):
                        all_parameterizable_params.append((arg, 'import', "import_dataframe")) # type: ignore
    
        # Get optimized code chunk, and get their parameterizable params
        code_chunks = get_code_chunks(steps_manager.steps_including_skipped[:steps_manager.curr_step_idx + 1], optimize=True)

        for code_chunk in code_chunks:
                parameterizable_params = code_chunk.get_parameterizable_params()
                all_parameterizable_params.extend(parameterizable_params)

        return all_parameterizable_params

# This function is used to get the parameterizable params for the UI in streamlit. 
# It returns a list of ParamMetadata objects, which are defined in mitosheet/types.py
# The ParamMetadata object includes various information that a streamlit developer might
# need to display the parameterizable params in the UI.
def get_parameterizable_params_metadata(steps_manager: StepsManagerType) -> List[ParamMetadata]:
        # First, get all the parameterizable params and the function params
        all_parameterizable_params = get_parameterizable_params({}, steps_manager)
        function_params: Dict[ParamName, ParamValue] = get_final_function_params_with_subtypes_turned_to_parameters(steps_manager, 'all')
        param_names = list(function_params.keys())

        # Now, we need to map the parameterizable params to the ParamMetadata type. 
        def map_tuple_to_param_data(args):
                param = args[0]
                param_name = args[1] 
                return {
                        # Removes the quotes and r-string from the param value because they aren't needed for streamlit. 
                        'original_value': param[0][2:-1] if param[0][:2] == "r'" else param[0],
                        'type': param[1],
                        'subtype': param[2],
                        # If the param is a df_name, then it is required for the function
                        # because we won't be able to store the initial value in the RunnableAnalysis for streamlit.
                        'required': param[2] == 'import_dataframe',
                        'name': param_name
                }

        return list(map(map_tuple_to_param_data, zip(all_parameterizable_params, param_names)))