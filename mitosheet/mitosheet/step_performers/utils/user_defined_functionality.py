
import importlib
from typing import Callable, List, Optional
import os


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
    
    # Get a list of functions defined in custom_functions.py
    functions = [getattr(custom_functions_module, attr) for attr in dir(custom_functions_module) if callable(getattr(custom_functions_module, attr))]

    # Filter out private functions
    functions = [func for func in functions if not func.__name__.startswith('_')]

    # Filter out functions imported from a different modules
    functions = [func for func in functions if func.__module__ == custom_functions_module.__name__]

    # Now, function_list contains the callable objects (functions) defined in custom_functions.py
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
    