





import inspect
from functools import wraps
from typing import Callable, List

from mitosheet.public.v3.types.utils import get_arg_cast_to_type
from mitosheet.types import PrimitiveTypeName


def cast_values_in_all_args_to_type(
    target_primitive_type_name: PrimitiveTypeName,
    primitive_types_to_ignore: List[PrimitiveTypeName] = []
) -> Callable:

    def wrap(sheet_function):
        @wraps(sheet_function)
        def wrapped_sheet_function(*args):   

            # For every arguement, go through and cast them to the correct type
            final_args = [
                get_arg_cast_to_type(target_primitive_type_name, arg, primitive_types_to_ignore=primitive_types_to_ignore)
                for arg in args
            ]

            return sheet_function(*final_args)        
        return wrapped_sheet_function
    return wrap


def cast_values_in_arg_to_type(
    arg_name: str,
    target_primitive_type_name: PrimitiveTypeName,
) -> Callable:
    def wrap(sheet_function):

        @wraps(sheet_function)
        def wrapped_sheet_function(*args):   

            arg_names = list(inspect.signature(sheet_function).parameters.keys())
            arg_index = arg_names.index(arg_name)

            final_args = [
                get_arg_cast_to_type(target_primitive_type_name, arg) if index == arg_index else arg
                for index, arg in enumerate(args)
            ]

            return sheet_function(*final_args)        
        return wrapped_sheet_function
    return wrap