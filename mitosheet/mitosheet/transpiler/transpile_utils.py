#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from copy import copy
import re
from typing import Any, Dict, List, Optional, Set, Tuple, Union

import pandas as pd
import numpy as np
from mitosheet.types import CodeOptions, ColumnHeader, ParamName, ParamValue, StepsManagerType
from mitosheet.utils import is_prev_version

# TAB is used in place of \t in generated code because
# Jupyter turns \t into a grey arrow, but converts four spaces into a tab.
TAB = '    '
NEWLINE_TAB = f'\n{TAB}'
NEWLINE = '\n'
OPEN_BRACKET = "{"
CLOSE_BRACKET = "}"


def column_header_list_to_transpiled_code(column_headers: Union[List[ColumnHeader], Set[ColumnHeader], List[Tuple[str, Optional[str]]]]) -> str:
    """
    A helper function for turning a list of column headers into a 
    valid list of Python code.
    """
    transpiled_column_headers = [
        column_header_to_transpiled_code(column_header)
        for column_header in column_headers
    ]
    joined_transpiled_column_headers = ', '.join(transpiled_column_headers)
    return f'[{joined_transpiled_column_headers}]'


def column_header_to_transpiled_code(column_header: ColumnHeader) -> str:
    """
    Makes sure the column header is correctly transpiled to 
    code in a way that makes sure it's referenced properly.

    Handles multi-index, boolean, string, and number columns 
    correctly.
    """
    # If this is a multi-index header, then we turn each of the pieces of the column
    # header into valid transpiled code, and then we combine them into a tuple
    if isinstance(column_header, tuple):
        column_header_parts = [column_header_to_transpiled_code(column_header_part) for column_header_part in column_header]
        column_header_parts_joined = ', '.join(column_header_parts)
        return f'({column_header_parts_joined})'

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

def list_to_string_without_internal_quotes(list: List[Any]) -> str:
    """
    Helper function for formatting a list as a string without 
    leading and trailing '
    """
    string = (', ').join(list)
    return "[" + string +  "]"

def column_header_map_to_string(column_header_map: Dict[ColumnHeader, ColumnHeader]) -> str:
    if len(column_header_map) <= 3:
        # If there are only a few column headers, we put them in a single line
        result = '{' 
        for column_header_key, column_header_value in column_header_map.items():
            result += f'{column_header_to_transpiled_code(column_header_key)}: {column_header_to_transpiled_code(column_header_value)}, '
        result = result[:-2] + "}" # don't take the last comma and space
        return result
    else:
        result = '{\n' 
        for column_header_key, column_header_value in column_header_map.items():
            result += f'{TAB}{column_header_to_transpiled_code(column_header_key)}: {column_header_to_transpiled_code(column_header_value)},\n'
        result = result[:-2] + "\n}" # don't take the last comma and new line
        return result


def param_dict_to_code(param_dict: Dict[str, Any], level: int=0, as_single_line: bool=False) -> str:
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
        NEWLINE_CONSTANT = '\n'

    if level == 0:
        code = f"{NEWLINE_CONSTANT}"
    else:
        code = f"dict({NEWLINE_CONSTANT}"

    value_num = 0
    for key, value in param_dict.items():
        if isinstance(value, dict):
            # Recurse on this nested param dictonary
            code_chunk = f"{key} = {param_dict_to_code(value, level=level + 1)}"
        else:
            # We use this slighly misnamed function to make sure values get transpiled right
            code_chunk = f"{key}={column_header_to_transpiled_code(value)}"
        
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
    else:
        # Make sure to close the dict
        code += f"{NEWLINE_CONSTANT}{TAB_CONSTANT * (level)})"
    
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

def convert_script_to_function(steps_manager: StepsManagerType, imports: List[str], code: List[str], function_name: str, function_params: Dict[ParamName, ParamValue]) -> List[str]:
    """
    Given a list of code lines, puts it inside of a function.
    """
    final_code = []

    # Add the imports
    final_code += imports
    if len(imports) == 0: # Make sure we have a newline if there are no imports
        final_code.append("")

    # The param
    param_names = _get_param_names_string(steps_manager, function_params)
    param_values = _get_param_values_string(steps_manager, function_params)

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



def get_default_code_options(analysis_name: str) -> CodeOptions:
    return {
        'as_function': False,
        'function_name': 'function_' + analysis_name[-4:], # Give it a random name, just so we don't overwrite them
        'function_params': dict()
    }