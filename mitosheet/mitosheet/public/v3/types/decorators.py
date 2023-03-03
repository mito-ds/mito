





from functools import partial, wraps
from typing import Any, Callable
from datetime import datetime, timedelta

import pandas as pd
from mitosheet.public.v3.types.utils import CONVERSION_FUNCTIONS

from mitosheet.types import PrimitiveTypeNames

def is_primitive_value(value: Any) -> bool:
    return isinstance(value, str) or \
        isinstance(value, int) or \
        isinstance(value, float) or \
        isinstance(value, bool) or \
        isinstance(value, datetime) or \
        isinstance(value, timedelta)
        # TODO: nan here?

def cast_values_in_arg_to_type(
    target_primitive_type_name: PrimitiveTypeNames,
) -> Callable:
    

    def wrap(sheet_function):
        @wraps(sheet_function)
        def wrapped_sheet_function(*args):   
            
            conversion_function = CONVERSION_FUNCTIONS[target_primitive_type_name]

            final_args = []

            for arg in args:
                if isinstance(arg, pd.Series):
                    final_args.append(arg.apply(conversion_function))
                elif is_primitive_value(arg):
                    final_args.append(conversion_function(arg))

            return sheet_function(*final_args)        
        return wrapped_sheet_function
    return wrap
