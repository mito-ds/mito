#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
import inspect
import re
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from collections import OrderedDict

import pandas as pd
import numpy as np
from mitosheet.state import State
from mitosheet.types import CodeOptions, CodeOptionsFunctionParams, ColumnHeader, ParamName, ParamSubtype, ParamValue, StepsManagerType
from mitosheet.utils import is_prev_version

# TAB is used in place of \t in generated code because
# Jupyter turns \t into a grey arrow, but converts four spaces into a tab.
TAB = '    '
NEWLINE_TAB = f'\n{TAB}'
NEWLINE = '\n'
OPEN_BRACKET = "{"
CLOSE_BRACKET = "}"


def get_column_header_list_as_transpiled_code(column_headers: Union[List[ColumnHeader], Set[ColumnHeader], List[Tuple[str, Optional[str]]]]) -> str:
    """
    A helper function for turning a list of column headers into a 
    valid list of Python code.
    """
    transpiled_column_headers = [
        get_column_header_as_transpiled_code(column_header)
        for column_header in column_headers
    ]
    joined_transpiled_column_headers = ', '.join(transpiled_column_headers)
    return f'[{joined_transpiled_column_headers}]'


def get_column_header_as_transpiled_code(column_header: ColumnHeader, tab_level: int=0) -> str:
    """
    Makes sure the column header is correctly transpiled to 
    code in a way that makes sure it's referenced properly.

    Handles multi-index, boolean, string, and number columns 
    correctly.
    """
    # If this is a multi-index header, then we turn each of the pieces of the column
    # header into valid transpiled code, and then we combine them into a tuple
    if isinstance(column_header, tuple):
        column_header_parts = [get_column_header_as_transpiled_code(column_header_part) for column_header_part in column_header]
        column_header_parts_joined = ', '.join(column_header_parts)
        return f'({column_header_parts_joined})'
    if isinstance(column_header, list):
        column_header_parts = [get_column_header_as_transpiled_code(column_header_part, tab_level=tab_level+1) for column_header_part in column_header]

        # Only add new lines in between entries if the full list would be too long
        total_length_of_column_headers = sum([len(column_header_part) for column_header_part in column_header_parts])
        if total_length_of_column_headers > 50:
            column_header_parts_joined = f',\n{TAB*(tab_level + 1)}'.join(column_header_parts)
            return f'[\n{TAB*(tab_level + 1)}{column_header_parts_joined}\n{TAB*tab_level}]'
        else:
            column_header_parts_joined = f','.join(column_header_parts)
            return f'[{column_header_parts_joined}]'

    # We must handle np.nan first because isinstance(np.nan, float) evaluates to True
    if not is_prev_version(pd.__version__, '1.0.0') and column_header is np.nan:
        return 'pd.np.nan'
    elif isinstance(column_header, int) or isinstance(column_header, float) or isinstance(column_header, bool):
        return str(column_header)
    elif isinstance(column_header, pd.Timestamp):
        return f'pd.to_datetime(\'{column_header.strftime("%Y-%m-%d %X")}\')'
    elif isinstance(column_header, pd.Timedelta):
        return f'pd.to_timedelta(\'{str(column_header)}\')'
    elif column_header is pd.NaT:
        return 'pd.NaT'
    elif not is_prev_version(pd.__version__, '1.0.0') and column_header is pd.NA:
        return 'pd.NA'
    elif isinstance(column_header, str) and "'" in column_header:
        return f"\"{column_header}\""

    return repr(column_header)

def get_list_as_string_without_internal_quotes(list: List[Any]) -> str:
    """
    Helper function for formatting a list as a string without 
    leading and trailing '
    """
    string = (', ').join(list)
    return "[" + string +  "]"

def get_column_header_map_as_code_string(column_header_map: Dict[ColumnHeader, ColumnHeader]) -> str:
    if len(column_header_map) <= 3:
        # If there are only a few column headers, we put them in a single line
        result = '{' 
        for column_header_key, column_header_value in column_header_map.items():
            result += f'{get_column_header_as_transpiled_code(column_header_key)}: {get_column_header_as_transpiled_code(column_header_value)}, '
        result = result[:-2] + "}" # don't take the last comma and space
        return result
    else:
        result = '{\n' 
        for column_header_key, column_header_value in column_header_map.items():
            result += f'{TAB}{get_column_header_as_transpiled_code(column_header_key)}: {get_column_header_as_transpiled_code(column_header_value)},\n'
        result = result[:-2] + "\n}" # don't take the last comma and new line
        return result


def get_param_dict_as_code(param_dict: Dict[str, Any], level: int=0, as_single_line: bool=False, tab_level: int=1, is_dict_entry: bool=False) -> str:
    """
    Takes a potentially nested params dictonary and turns it into a
    code string that we can use in the graph generated code.

    level should be 0 if we are at the highest level dict, and otherwise
    should increment by 1 anytime we enter a new subdictonary.
    """

    # Make sure we handle as a single line properly
    if as_single_line:
        TAB_CONSTANT = ''
        NEWLINE_CONSTANT = ''
    else:
        TAB_CONSTANT = TAB
        NEWLINE_CONSTANT = f'\n{TAB_CONSTANT * tab_level}'

    code = f"{NEWLINE_CONSTANT}"

    value_num = 0
    for key, value in param_dict.items():
        # If we're defining a dict entry, we need to add quotes around the key and use a colon
        key_definition = f'"{key}": ' if is_dict_entry else f'{key}='
        if isinstance(value, dict):
            # Recurse on this nested param dictonary
            code_chunk = f"{key_definition}{{{f'{get_param_dict_as_code(value, level=level + 1, is_dict_entry=True)}{NEWLINE_CONSTANT}{TAB_CONSTANT * (level+1)}'}}}"
        elif isinstance(value, list):
            code_chunk = f"{key_definition}{get_column_header_as_transpiled_code(value, tab_level=tab_level + 1)}"
        else:
            # We use this slighly misnamed function to make sure values get transpiled right
            code_chunk = f"{key_definition}{get_column_header_as_transpiled_code(value)}"
        
        # If we're not on the first value in this dict, we need to add a 
        # command new line after the last value
        if value_num != 0:
            code += f", {NEWLINE_CONSTANT}"

        value_num += 1

        # Add spacing before the param
        code += f"{TAB_CONSTANT * (level + 1)}"

        code += f"{code_chunk}"

    if level == 0:
        code += f"{NEWLINE_CONSTANT}"
    
    return code

def get_str_param_name(steps_manager: StepsManagerType, index: int) -> str:
    # We go and find the first state, and then get the name of the df at this index
    df_name = steps_manager.steps_including_skipped[0].final_defined_state.df_names[index]
    return df_name + '_path'

def _get_params_dict_for_function_call(steps_manager: StepsManagerType, function_params: Dict[ParamName, ParamValue]) -> Dict[ParamName, ParamValue]:
    """
    Returns a dictionary of the param names and values for the function call. Takes special care
    to when you pass function_params that overwrite some of the original args to the function call.
    """
    from mitosheet.updates.args_update import is_string_arg_to_mitosheet_call

    original_args_values = steps_manager.original_args_raw_strings
    original_args_names = []

    for index, original_arg_value in enumerate(original_args_values):

        if original_arg_value in function_params.values():
            # If this arg is being overwritten by a param, we need to get the name of the param
            # instead of the original arg name
            param_name = list(function_params.keys())[list(function_params.values()).index(original_arg_value)]
            original_args_names.append(param_name)
        else:
            if is_string_arg_to_mitosheet_call(original_arg_value):
                original_args_names.append(get_str_param_name(steps_manager, index))
            else:
                original_args_names.append(original_arg_value)

    args_dict = {param_name: param_value for param_name, param_value in zip(original_args_names, original_args_values)}

    # Then, we extend with the new params, not including any params that are already in the args
    for param_name, param_value in function_params.items():
        if param_name not in args_dict:
            args_dict[param_name] = param_value

    return args_dict


def _get_param_names_string(steps_manager: StepsManagerType, function_params: Dict[ParamName, ParamValue]) -> str:
    params_names = list(_get_params_dict_for_function_call(steps_manager, function_params).keys())
    return ", ".join(params_names)

def _get_param_values_string(steps_manager: StepsManagerType, function_params: Dict[ParamName, ParamValue]) -> str:
    params_values = list(_get_params_dict_for_function_call(steps_manager, function_params).values())
    return ", ".join(params_values)

def _get_return_variables_string(steps_manager: StepsManagerType, function_params: Dict[ParamName, ParamValue]) -> str:
     
    final_df_names = copy(steps_manager.curr_step.df_names)
    for param_name, param_value in function_params.items():
        if param_value in final_df_names:
            final_df_names[final_df_names.index(param_value)] = param_name

    return ", ".join(final_df_names)

import re

def replace_newlines_with_newline_and_tab(text: str) -> str:
    pattern = r'(?<!\\)\n'  # Negative lookbehind for '\'
    replacement = '\n' + f'{TAB}'  # Newline followed by a tab
    result = re.sub(pattern, replacement, text)
    return result

def get_final_function_params_with_subtypes_turned_to_parameters(
        steps_manager: StepsManagerType, 
        function_params: CodeOptionsFunctionParams # type: ignore
    ) -> OrderedDict:
    """
    It's often useful in Streamlit dashboards to allow app creators to specify things like: 
    1. Turn all of the imported CSV files into parameters
    2. Turn all of the exported file paths into parameters

    As such, we let users specify the subtype they want to generate params for.
    """
    if isinstance(function_params, str) or isinstance(function_params, list):
        final_params = OrderedDict()

        from mitosheet.api.get_parameterizable_params import get_parameterizable_params
        parameterizable_params = get_parameterizable_params({}, steps_manager)
        
        number_of_params_of_subtype: Dict[ParamSubtype, int] = {}
        for param_value, param_type, param_subtype in parameterizable_params:
            param_index = number_of_params_of_subtype.get(param_subtype, 0)
            if isinstance(function_params, str) and (function_params == param_subtype or function_params == 'all'):
                final_params[f"{param_subtype}_{param_index}"] = param_value
                number_of_params_of_subtype[param_subtype] = param_index + 1
            elif param_subtype in function_params:
                final_params[f"{param_subtype}_{param_index}"] = param_value
                number_of_params_of_subtype[param_subtype] = param_index + 1

        return final_params
    return function_params


def get_script_as_function(
        steps_manager: StepsManagerType, 
        imports: List[str], 
        code: List[str], 
        function_name: str, 
        function_params: CodeOptionsFunctionParams, # type: ignore
        call_function: bool
    ) -> List[str]:
    """
    Given a list of code lines, puts it inside of a function.
    """
    final_code = []

    # Add the imports
    final_code += imports
    final_code.append("")

    # Get the final function param
    function_params = get_final_function_params_with_subtypes_turned_to_parameters(steps_manager, function_params)

    # The param
    param_names = _get_param_names_string(steps_manager, function_params)

    # Add the function definition
    final_code.append(f"def {function_name}({param_names}):")

    for line in code:
        # Add the code, making sure to indent everything, even if it's on the newline
        # or if it's the closing paren. We take special care not to mess inside of any strings, simply
        # by indenting any newline that is not preceeded by a \
        line = f"{TAB}{line}"
        line = replace_newlines_with_newline_and_tab(line)

        # Then, for any additional function params we defined, we relace the internal param value. Note that 
        # we only replace for 
        for param_name, param_value in function_params.items():
            if "'" in param_value or '"' in param_value:
                line = line.replace(param_value, param_name)
            else:
                line = re.sub(r'\b%s\b' % re.escape(param_value), param_name, line) 

        final_code.append(line)

    # Add the return statement, where we return the final dfs
    return_variables_string = _get_return_variables_string(steps_manager, function_params)
    final_code.append(f"{TAB}return {return_variables_string}")
    final_code.append("")

    # If we are not calling the function, we just return the code without the call at the end
    if not call_function:
        return final_code

    # Build the params and variables taking special care to ensure that dataframes and file paths 
    # that are passed as parameters to the function. 
    final_params_to_call_function_with = []

    for param_name, param_value in _get_params_dict_for_function_call(steps_manager, function_params).items():
        if param_name in function_params:
            final_params_to_call_function_with.append(param_name)
            final_code.append(f"{param_name} = {param_value}")
        else:
            final_params_to_call_function_with.append(param_value)

    if len(function_params) > 0:
        final_code.append("")

    final_params_to_call_function_with_string = ", ".join(final_params_to_call_function_with)

    if len(return_variables_string) > 0:
        final_code.append(f"{return_variables_string} = {function_name}({final_params_to_call_function_with_string})")
    else:
        final_code.append(f"{function_name}({final_params_to_call_function_with_string})")

    return final_code

def get_imports_for_custom_python_code(code: List[str], steps_manager: StepsManagerType) -> List[str]:

    import_map: Dict[str, List[str]] = {}

    all_custom_python_code = (steps_manager.user_defined_importers or []) + (steps_manager.user_defined_functions or []) + (steps_manager.user_defined_editors or [])

    for func in all_custom_python_code:
        if any(func.__name__ in line for line in code):

            # If the function is defined in a module, we add it to the import map
            module = inspect.getmodule(func)

            # Note: the __main__ check handles JupyterLab module (not sure this is true in all cases)
            if module is not None and module.__name__ != '__main__':
                module_name = module.__name__
                function_name = func.__name__

                imports_from_module = import_map.get(module_name, [])
                imports_from_module.append(function_name)

                import_map[module_name] = imports_from_module

            # Otherwise, we are in JupyerLab, and if we're being asked to import
            # this function, we literally just inline the function. In this case,
            # you need to do all your imported _inside_ the function dynamically
            # because the function is inlined
            # TODO: this is not working, but I'm ignoring JupyterLab custom imports
            # for now -- this is hard..
            #else:
            #    inlined_functions.append(inspect.getsource(func))
                

    import_strings = [
        f"from {module_name} import {', '.join(function_names)}"
        for module_name, function_names in import_map.items()
    ]

    return import_strings           



def get_default_code_options(analysis_name: str) -> CodeOptions:
    return {
        'as_function': False,
        'call_function': True,
        'function_name': 'function_' + analysis_name[-4:], # Give it a random name, just so we don't overwrite them
        'function_params': OrderedDict(),
        'import_custom_python_code': False
    }


def get_globals_for_exec(state: State, public_interface: int) -> Dict[str, Any]:
    """
    Anytime you are exec'ing transpiled code, you need to pass some global variables including:
    1. The public interface exported by Mito for this public interface code
    2. The user defined functions and importers
    3. The dataframe names

    This function collects these all in one location, so they then can be exec'ed.
    """

    df_names_to_df = {
        df_name: df for df, df_name in 
        zip(
            state.dfs,
            state.df_names
        )
    }
    
    if public_interface == 1:
        import mitosheet.public.v1 as v1
        local_vars = v1.__dict__
    elif public_interface == 2:
        import mitosheet.public.v2 as v2
        local_vars = v2.__dict__
    elif public_interface == 3:
        import mitosheet.public.v3 as v3
        local_vars = v3.__dict__
    else:
        import mitosheet as original
        local_vars = original.__dict__

    user_defined_functions = state.user_defined_functions
    user_defined_importers = state.user_defined_importers
    user_defined_editors = state.user_defined_editors

    local_vars = {
        **local_vars,
        **df_names_to_df,
        **{f.__name__: f for f in user_defined_functions},
        **{f.__name__: f for f in user_defined_importers},
        **{f.__name__: f for f in user_defined_editors},
    }

    return local_vars
