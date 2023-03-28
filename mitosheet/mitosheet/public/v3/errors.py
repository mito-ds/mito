




from functools import wraps
import inspect
from typing import Any, Callable, Tuple

from mitosheet.errors import MitoError


def make_invalid_param_type_conversion_error(value: Any, target_type: str) -> MitoError:
    """
    When a user passes an input to a function that cannot be converted to the correct
    type, this error is thrown.
    """

    return MitoError(
        'invalid_param_type_conversion_error',
        'Param Type Conversion Error',
        f'The value {value} cannot be converted to {target_type}',
        error_modal=False
    )

def make_invalid_arg_error(sheet_function_name: str, arg_name: str, type_name: str) -> MitoError:
    """
    When a user passes an input to a function that is the wrong type
    """

    return MitoError(
        'invalid_arg_error',
        f'{sheet_function_name}: {arg_name} is Invalid',
        f'Error in {sheet_function_name}. Argument {arg_name} is invalid. It cannot be a {type_name}',
        error_modal=False
    )


def get_type_args(tp: Any) -> Tuple[Any, ...]:
    try:
        from typing import get_args
        return get_args(tp)
    except:
        if hasattr(tp, '__args__'):
            return tp.__args__
        elif hasattr(tp, '__orig_bases__'):
            return tp.__orig_bases__[0].__args__
        elif hasattr(tp, '__union_params__'): # handle Union types
            return tp.__union_params__
        else:
            return ()


def handle_sheet_function_errors(sheet_function: Callable) -> Callable:

    @wraps(sheet_function)
    def wrapped_sheet_function(*args):   

        parameters = inspect.signature(sheet_function).parameters

        # We ensure that all of the paramters match the type that is given to them
        for parameter, arg in zip(parameters.values(), args):
            if not any(isinstance(arg, t) for t in get_type_args(parameter.annotation)):
                raise make_invalid_arg_error(sheet_function.__name__, parameter.name, type(arg).__name__)
        
        try:
            return sheet_function(*args)
        except MitoError:
            raise 
        else:
            # TODO Raise a good sheet function error
            pass
            # TODO: Do much better error reporting here!        
    return wrapped_sheet_function
