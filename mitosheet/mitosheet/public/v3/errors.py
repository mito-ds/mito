




from functools import wraps
import inspect
from typing import Any, Callable, Tuple

from mitosheet.errors import MitoError, get_recent_traceback, make_function_error


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

def make_invalid_arg_error(sheet_function_name: str, arg_name: str, arg_index: int, type_name: str) -> MitoError:
    """
    When a user passes an input to a function that is the wrong type
    """

    arg_index_str = ''
    if arg_index == 0:
        arg_index_str = '1st'
    elif arg_index == 1:
        arg_index_str = '2nd'
    elif arg_index == 2:
        arg_index_str = '3rd'
    else:
        arg_index_str = f'{arg_index + 1}th'

    
    type_name_str = ''
    if type_name == 'DataFrame':
        type_name_str = 'an entire column reference'
    elif type_name == 'Series':
        type_name_str = 'a single cell reference'
    elif type_name == 'RollingRange':
        type_name_str = 'a range reference'
    else:
        type_name_str = f'a {type_name}.'
    

    return MitoError(
        'invalid_arg_error',
        f'{sheet_function_name}: {arg_name} is Invalid',
        f'Error in {sheet_function_name}. The {arg_index_str} argument ({arg_name}) is invalid. It cannot be {type_name_str}.',
        error_modal=False
    )


def get_type_args(tp: Any) -> Tuple[Any, ...]:

    # If the type is just a single class, then we just return this type
    if inspect.isclass(tp):
        return (tp,)

    try:
        from typing import get_args
        return get_args(tp)
    except:
        # Handle older versions of Python without the get_args function
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
        for index, (parameter, arg) in enumerate(zip(parameters.values(), args)):
            if not any(isinstance(arg, t) for t in get_type_args(parameter.annotation)):
                raise make_invalid_arg_error(sheet_function.__name__, parameter.name, index, type(arg).__name__)
        
        try:
            return sheet_function(*args)
        except MitoError:
            raise 
        except:
            raise make_function_error(sheet_function.__name__, error_modal=False)
    
    return wrapped_sheet_function
