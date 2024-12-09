
from typing import Any, Dict, List, Optional
import pandas as pd

def get_globals_to_compare(globals: Dict[str, Any], variables_to_compare: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Globals have a lot of stuff we don't actually care about comparing. 
    For now, we only care about comparing variables created by the script.
    This functionremoves everything else
    """
    if variables_to_compare is not None:
        # Get the variables to compare from the globals and remove everything else
        return {k: v for k, v in globals.items() if k in variables_to_compare}

    globals = {k: v for k, v in globals.items() if k != "__builtins__"}

    # Remove functions from the globals since we don't want to compare them
    globals = {k: v for k, v in globals.items() if not callable(v)}

    return globals

def assert_equal_globals(expected_globals: Dict[str, Any], actual_globals: Dict[str, Any], variables_to_compare: Optional[List[str]] = None) -> bool:
    """
    Compares two dictionaries of globals, and returns True if they are equal,
    and False otherwise.

    Take special care to correctly check equality for pandas DataFrames.
    """
    expected_globals = get_globals_to_compare(expected_globals, variables_to_compare)
    actual_globals = get_globals_to_compare(actual_globals, variables_to_compare)


    # First, check if the keys are the same
    if expected_globals.keys() != actual_globals.keys():
        return False
    
    global_keys_one = set(expected_globals.keys())
    for key in global_keys_one:
        var_one = expected_globals[key]
        var_two = actual_globals[key]

        if isinstance(var_one, pd.DataFrame) and isinstance(var_two, pd.DataFrame):
            if not var_one.equals(var_two):
                return False
        else:
            if var_one != var_two:
                return False
    
    return True
