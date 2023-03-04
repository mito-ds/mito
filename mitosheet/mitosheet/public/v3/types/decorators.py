





from functools import partial, wraps
from typing import Any, Callable
from datetime import datetime, timedelta

import pandas as pd
from mitosheet.public.v3.types.utils import CONVERSION_FUNCTIONS, get_primitive_type_name_from_primitive_value, get_primitive_type_name_from_series

from mitosheet.types import PrimitiveTypeName

def is_primitive_value(value: Any) -> bool:
    return isinstance(value, str) or \
        isinstance(value, int) or \
        isinstance(value, float) or \
        isinstance(value, bool) or \
        isinstance(value, datetime) or \
        isinstance(value, timedelta)
        # TODO: nan here?

def cast_values_in_arg_to_type(
    target_primitive_type_name: PrimitiveTypeName,
) -> Callable:

    def wrap(sheet_function):
        @wraps(sheet_function)
        def wrapped_sheet_function(*args):   
            
            conversion_functions = CONVERSION_FUNCTIONS[target_primitive_type_name]

            final_args = []

            for arg in args:
                if isinstance(arg, pd.Series):
                    series_primitive_type = get_primitive_type_name_from_series(arg)
                    conversion_function = conversion_functions[series_primitive_type]
                    if conversion_function is not None:
                        final_args.append(arg.apply(conversion_function)) # Why doesn't type work?
                    else:
                        raise Exception(f"Cannot convert from {series_primitive_type} series to {target_primitive_type_name}")
                elif is_primitive_value(arg):
                    primitive_type = get_primitive_type_name_from_primitive_value(arg)
                    conversion_function = conversion_functions[primitive_type]
                    if conversion_function is not None:
                        final_args.append(conversion_function(arg))
                    else:
                        raise Exception(f"Cannot convert from {primitive_type} series to {target_primitive_type_name}")

            return sheet_function(*final_args)        
        return wrapped_sheet_function
    return wrap
