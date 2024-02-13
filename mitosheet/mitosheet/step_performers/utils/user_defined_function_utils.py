
import importlib
import inspect
import os
from typing import Any, Callable, Dict, List, Optional, Tuple

import pandas as pd

from mitosheet.errors import MitoError
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import \
    get_column_header_as_transpiled_code
from mitosheet.types import UserDefinedFunctionParamType
from mitosheet.extensions.v1 import ColumnHeader


def check_valid_sheet_functions(
        sheet_functions: Optional[List[Callable]]=None,
    ) -> None:
    if sheet_functions is None or len(sheet_functions) == 0:
        return

    from mitosheet.user.utils import is_enterprise, is_running_test
    if not is_enterprise() and not is_running_test():
        raise ValueError("sheet_functions are only supported in the enterprise version of Mito. See Mito plans https://www.trymito.io/plans")

    if not isinstance(sheet_functions, list):
        raise ValueError(f"sheet_functions must be a list, but got {type(sheet_functions)}")
    
    for sheet_function in sheet_functions:
        if not callable(sheet_function):
            raise ValueError(f"sheet_functions must be a list of functions, but got {sheet_function} which is not callable.")
        
        # Check if has a __name__ attribute
        if not hasattr(sheet_function, '__name__'):
            raise ValueError(f"sheet_functions must be a list of functions, but got {sheet_function} which does not have a __name__ attribute. Please use a named function instead.")
        
        if sheet_function.__name__ == '<lambda>':
            raise ValueError(f"sheet_functions must be a list of functions, but got {sheet_function} which is a lambda function. Please use a named function instead.")
        
        # Check the name is all caps
        if not sheet_function.__name__.isupper():
            raise ValueError(f"sheet_functions must be a list of functions, but got {sheet_function} which has a name that is not all caps. Please use a named function instead.")
    
def get_functions_from_path(path: str) -> List[Callable]:
    # Get the filename from the path
    filename = os.path.basename(path)

    # Create a module spec from the file path
    module_spec = importlib.util.spec_from_file_location(filename, path)

    if module_spec is None:
        # Does path end in .py
        if not path.endswith('.py'):
            raise ValueError(f"Could not find a module spec for {path}. The path must end in .py for custom sheet functions to be loaded. Please have an admin update this file path and try again.")
        raise ValueError(f"Could not find a module spec for {path}. Please have an admin update this file path and try again.")

    # Create the module by loading the spec
    custom_functions_module = importlib.util.module_from_spec(module_spec)

    try:
        # Execute the module (this runs the code in the file)
        module_spec.loader.exec_module(custom_functions_module) # type: ignore
    except Exception:
        raise ImportError(f"The file path {path} does not exist, and so this file cannot be read in for the custom sheet functions. Please have an admin update this file path and try again.")
    
    # Get a list of functions defined in custom functions file
    functions = [getattr(custom_functions_module, attr) for attr in dir(custom_functions_module) if callable(getattr(custom_functions_module, attr))]

    # Filter out private functions
    functions = [func for func in functions if not func.__name__.startswith('_')]

    # Filter out functions imported from a different modules
    functions = [func for func in functions if func.__module__ == custom_functions_module.__name__]

    # Now, function_list contains the callable objects (functions) defined in custom functions file
    return functions


def get_non_validated_custom_sheet_functions(path: str) -> List[Callable]:
    functions = get_functions_from_path(path)

    # Filter out any functions that are not all uppercase
    return [func for func in functions if func.__name__.isupper()]


def validate_and_wrap_sheet_functions(user_defined_sheet_functions: Optional[List[Callable]]) -> List[Callable]:
    check_valid_sheet_functions(user_defined_sheet_functions)
    from mitosheet.public.v3.errors import handle_sheet_function_errors
    user_defined_functions = [handle_sheet_function_errors(user_defined_sheet_function) for user_defined_sheet_function in (user_defined_sheet_functions if user_defined_sheet_functions is not None else [])]
    return user_defined_functions
    

def validate_user_defined_editors(user_defined_editors: Optional[List[Callable]]) -> List[Callable]:
    if user_defined_editors is None:
        return []

    for f in user_defined_editors:
        df_arguments = []
        parameters = inspect.signature(f).parameters
        has_previous_dataframe_arg = False
        for param_name in parameters:
            annotation = parameters[param_name].annotation
            if annotation == pd.DataFrame:
                df_arguments.append(param_name)
                has_previous_dataframe_arg = True

            if annotation == ColumnHeader:
                if not has_previous_dataframe_arg:
                    raise ValueError(f"Editor {f.__name__} has a ColumnHeader argument {param_name}, but does not have a pd.DataFrame argument preceeding it. Please ensure that the first argument is a pd.DataFrame.")

        if len(df_arguments) != 1:
            raise ValueError(f"Editor {f.__name__} must only have a single dataframe parameter, but instead got {df_arguments} as arguments")
        
    return user_defined_editors


def get_user_defined_function_param_type(f: Callable, param_name: str) -> UserDefinedFunctionParamType:

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
    elif param_type == pd.DataFrame:
        return 'DataFrame'
    elif param_type == ColumnHeader:
        return 'ColumnHeader'
    else:
        return 'any'


def get_param_names_to_types_for_user_defined_functon(f: Callable) -> Dict[str, UserDefinedFunctionParamType]:
    param_names_to_types = {}

    for name in inspect.signature(f).parameters:
        param_names_to_types[name] = get_user_defined_function_param_type(f, name)

    return param_names_to_types

def get_domain_from_user_defined_function(f: Callable) -> Optional[str]:
    """
    Given a user defined importer, return the domain that it's associated with. If it's not associated with a domain, return None.

    Currently, we just support starting a doc string line with "Domain: " to specify the domain.
    TODO: make this more robust in the future
    """
    
    docstring = f.__doc__
    if docstring is None:
        return None

    for line in docstring.lower().split('\n'):
        if line.strip().startswith('domain: '):
            return line.strip().split('domain: ')[1].strip()
    
    return None

def get_docstring_for_user_defined_function(f: Callable) -> Optional[str]:
    """
    Given a user defined importer, return the docstring for it. Will cleanup extra
    whitespace due to the way that docstrings are formatted in Python.

    Will also get rid of the domain line if it exists.
    """

    docstring = f.__doc__
    if docstring is None:
        return None
    
    lines = docstring.split("\n")
    # Remove the domain line if it exists
    lines = [line for line in lines if not line.strip().lower().startswith('domain: ')]
    return ' '.join(lines)

def get_user_defined_importers_for_frontend(state: Optional[State]) -> List[Any]:
    if state is None:
        return []

    return [
        {
            'name': f.__name__,
            'docstring': get_docstring_for_user_defined_function(f),
            'parameters': get_param_names_to_types_for_user_defined_functon(f),
            'domain': get_domain_from_user_defined_function(f)
        }
        for f in state.user_defined_importers
    ]

def get_user_defined_editors_for_frontend(state: Optional[State]) -> List[Any]:
    if state is None:
        return []

    return [
        {
            'name': f.__name__,
            'docstring': f.__doc__,
            'parameters': get_param_names_to_types_for_user_defined_functon(f),
        }
        for f in state.user_defined_editors
    ]

def get_importer_params_and_type_and_value(f: Callable, frontend_params: Dict[str, str]) -> Dict[str, Tuple[UserDefinedFunctionParamType, str]]:
    importer_params_and_type_and_value = {}

    for param_name, param_value in frontend_params.items():
        param_type = get_user_defined_function_param_type(f, param_name)
        importer_params_and_type_and_value[param_name] = (param_type, param_value)
    
    return importer_params_and_type_and_value


def get_user_defined_function_param_type_and_execute_value_and_transpile_value(
        state: State,
        f: Callable, 
        frontend_params: Dict[str, str]
    ) -> Dict[str, Tuple[UserDefinedFunctionParamType, Any, Any]]: # TODO: document this type better
    """
    Given a current state, a user defined function f, and the frontend params that the user configured
    for this function f, return a dictionary mapping the parameter name to a tuple:
    1.  parameter type
    2.  the value to be passed to the function when executing it in the step performer
    3.  the value to be transpiled in the code chunk for the parameter

    This function is responsible for casting the frontend params to the appropriate type, and for
    transpiling the values to be passed to the function. It throws appropriate errors if the frontend
    params cannot be cast to the appropriate type.
    """
    user_defined_function_params: Dict[str, Tuple[UserDefinedFunctionParamType, Any, Any]] = {}

    sheet_index = None
    for param_name, (param_type, param_value) in get_importer_params_and_type_and_value(f, frontend_params).items():
        try:
            if param_type == 'DataFrame':
                sheet_index = state.df_names.index(param_value)
                df = state.dfs[sheet_index]
                # Because we want to just transpile the dataframe name, the third tuple value (the value to be transpiled) should
                # not be wrapped in get_column_header_as_transpiled_code
                # NOTE: we also make a copy of the DF to avoid issues with it being modified by the calling function
                user_defined_function_params[param_name] = (param_type, df.copy(), param_value)
            elif param_type == 'ColumnHeader':
                # If it's a column header, then we should have already gotten the sheet index
                if sheet_index is None:
                    raise ValueError(f"Parameter {param_name} is a ColumnHeader, but is not directly preceeded by a pd.DataFrame argument. As such, it's referencing an ambigious dataframe.")
                
                # notably, the column header type will actually be provided as a column id? Does that make sense? I think so -- that's what we can 
                # select on in the frontend. TODO: think about if this makes sense with the way replaying works...
                column_header = state.column_ids.get_column_header_by_id(sheet_index, param_value)
                user_defined_function_params[param_name] = (param_type, column_header, get_column_header_as_transpiled_code(column_header))
            elif param_type == 'str':
                user_defined_function_params[param_name] = (param_type, param_value, get_column_header_as_transpiled_code(param_value))
            elif param_type == 'int':
                execute_value: Any = int(param_value)
                user_defined_function_params[param_name] = (param_type, execute_value, get_column_header_as_transpiled_code(execute_value))
            elif param_type == 'float':
                execute_value = float(param_value) 
                user_defined_function_params[param_name] = (param_type, execute_value, get_column_header_as_transpiled_code(execute_value))
            elif param_type == 'bool':
                execute_value = 'true' in param_value.lower()
                user_defined_function_params[param_name] = (param_type, execute_value, get_column_header_as_transpiled_code(execute_value))
            else:
                try:
                    # If we don't know the type (it's untyped), we try and convert the value to a python object -- using an eval. If that fails, 
                    # we just keep it as a string
                    execute_value = eval(param_value)
                    user_defined_function_params[param_name] = (param_type, execute_value, get_column_header_as_transpiled_code(execute_value))
                except:
                    # If we cannot eval the result, it's likely a string, so we just pass it through
                    user_defined_function_params[param_name] = (param_type, param_value, get_column_header_as_transpiled_code(param_value))
        except:
            raise MitoError(
                'user_defined_function_error',
                f"Function {f.__name__} raised an error.",
                f"Parameter {param_name} with value {param_value} cannot be cast to type {param_type}. Please insert an appropriate value.",
                error_modal=False
            )

    return user_defined_function_params

def get_transpiled_user_defined_function_params(user_defined_function_param_types_and_values: Dict[str, Tuple[UserDefinedFunctionParamType, Any, Any]]) -> str:
    param_strings = []
    for param_name, (_, _, transpiled_value) in user_defined_function_param_types_and_values.items():
        param_strings.append(f'{param_name}={transpiled_value}')
    return ", ".join(param_strings)
