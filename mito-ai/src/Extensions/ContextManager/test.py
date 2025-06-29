import json
import inspect
import sys
import types
import re
from typing import Any, Dict

# Check if pandas is imported
_is_pandas_imported = False
try:
    import pandas as pd
    _is_pandas_imported = True
except:
    pass

# Check if numpy is imported
_is_numpy_imported = False
try:
    import numpy as np
    _is_numpy_imported = True
except:
    pass

def get_approximate_token_size(text):
    """
    Rough estimate of token size based on character count
    Most tokenizers average around 4 characters per token
    """
    return len(text) // 4

def safe_truncate_string(s, max_length=500):
    """Safely truncate a string to max_length"""
    if not isinstance(s, str):
        return str(s)
    if len(s) > max_length:
        return s[:max_length] + "... [truncated]"
    return s

def get_dataframe_summary(df, max_columns=200, max_sample_size=5, max_string_length=100):
    """
    Get a summary of a dataframe with limits on columns and samples
    """
    # If dataframe is too large, only process a subset
    total_rows = len(df)
    total_columns = len(df.columns)
    
    # Select a subset of columns if there are too many
    columns = list(df.columns)[:max_columns]
    
    # Create a simplified structure
    structure = {
        "shape": f"{total_rows} rows × {total_columns} columns",
        "columns": {},
    }
    
    # Add column information
    for column in columns:
        # Create basic type and sample information
        structure["columns"][column] = {
            "dtype": str(df[column].dtype),
            "samples": []
        }
        
        # Add a few sample values
        for i in range(min(max_sample_size, len(df))):
            value = df[column].iloc[i]
            if pd.isna(value):
                structure["columns"][column]["samples"].append(None)
            elif isinstance(value, str):
                # Truncate long strings
                structure["columns"][column]["samples"].append(safe_truncate_string(value, max_string_length))
            elif not isinstance(value, (int, float, bool, type(None))):
                # Convert non-primitive types to string and truncate
                structure["columns"][column]["samples"].append(safe_truncate_string(str(value), max_string_length))
            else:
                structure["columns"][column]["samples"].append(value)
    
    # Add message if we truncated columns
    if total_columns > max_columns:
        structure["note"] = f"Only showing first {max_columns} columns"
    
    return structure

def is_from_mitosheet(obj):
    """Check if an object is from any mitosheet module"""
    try:
        module = inspect.getmodule(obj)
        if module and (module.__name__.startswith('mitosheet')):
            return True

        # if the dictionary contains all of the mito functions, then we can assume that the object is from mitosheet
        mito_functions = ["STRIPTIMETOMONTHS", "GETNEXTVALUE", "FILLNAN"]
        if isinstance(obj, dict) and all(key in obj for key in mito_functions):
            return True
    except Exception:
        return False
    return False

def get_list_summary(lst) -> Dict[str, Any]:
    """Get summary info for lists without including all values"""
    if not isinstance(lst, list):
        return {}
    
    if len(lst) > 10:
        sample = lst[:5] + lst[-5:]
    else: 
        sample = lst
        
    list_summary = {
        "length": len(lst),
        "sample": sample,
        "note": f"Only showing first 5 and last 5 elements"
    }

    return list_summary

def get_tuple_summary(tup) -> Dict[str, Any]:
    """Get summary info for tuples without including all values"""
    if not isinstance(tup, tuple):
        return {}
    
    return get_list_summary(list(tup))

def get_dict_summary(d) -> Dict[str, Any]:
    """Get summary info for dictionaries without including all values"""
    if not isinstance(d, dict):
        return {}
    
    return get_list_summary(list(d.items()))

def get_string_summary(s, max_length=500) -> Dict[str, Any]:
    """Get summary info for strings without including all values"""
    if not isinstance(s, str):
        return {}
    
    if len(s) > max_length:
        sample = s[:max_length] + "... [truncated]"
    else:
        sample = s
        
    return {
        "sample": sample
    }

def get_numpy_array_info(arr) -> Dict[str, Any]:
    """Get summary info for numpy arrays without including all values"""
    if not isinstance(arr, np.ndarray):
        return {}
    
    if len(arr) > 10:
        sample = list(arr[:5]) + list(arr[-5:])
    else: 
        sample = list(arr)
        
    info = {
        "shape": str(arr.shape),
        "dtype": str(arr.dtype),
        "sample": sample
    }
    
    return info

def safe_serialize_value(value, max_length=500) -> Dict[str, Any]:
    """Safely serialize a value to a reasonable size"""
    
    if _is_pandas_imported and isinstance(value, pd.DataFrame):
        return get_dataframe_summary(value)
    
    # Handle pandas Series
    if _is_pandas_imported and isinstance(value, pd.Series):
        return {
            "length": len(value),
            "dtype": str(value.dtype),
            "sample": value.head(3).tolist() if len(value) > 0 else []
        }
        
    # Handle numpy arrays
    if _is_numpy_imported and isinstance(value, np.ndarray):
        return get_numpy_array_info(value)
    
    # Handle large collections
    if isinstance(value, list):
        return get_list_summary(value)
    
    if isinstance(value, tuple):
        return get_tuple_summary(value)
    
    if isinstance(value, dict):
        return get_dict_summary(value)
    
    # Handle strings
    if isinstance(value, str):
        return get_string_summary(value)
    
    # Handle objects with large string representations
    try:
        str_val = str(value)
        if len(str_val) > max_length:
            return str_val[:max_length] + "... [truncated]"
    except:
        pass
    
    return value

def structured_globals(max_token_estimate=100000, max_df_columns=10, max_sample_size=3):
    """
    Get structured information about global variables with size limits.
    
    Parameters:
    - max_token_estimate: Maximum estimated tokens to return
    - max_df_columns: Maximum columns to include for dataframes
    - max_sample_size: Maximum number of sample values per column
    """
    output = []
    
    global_vars = globals().items()
        
    for k, v in global_vars:
        
        value_summary = safe_serialize_value(v)
        
        output.append({
            "variable_name": k,
            "type": type(v).__name__,
            **value_summary
        })
        



    
    # Return the JSON string
    result = json.dumps(output)
    approx_tokens = get_approximate_token_size(result)
    return result
