#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Decorators for sheet functions, that enable the sheet functions
to make sure the inputs they are getting are the inputs they want
"""
from functools import partial, wraps
from typing import Any, Callable

import pandas as pd
from mitosheet.errors import (MitoError, make_function_error,
                              make_invalid_arguments_error)
from mitosheet.sheet_functions.sheet_function_utils import \
    is_series_of_constant
from mitosheet.sheet_functions.types import get_function_to_convert_to_series
from mitosheet.sheet_functions.types.utils import (get_nan_indexes_metadata,
                                                   put_nan_indexes_back)


def handle_sheet_function_errors(sheet_function: Callable) -> Callable:
    """
    The first decorator that should be applied to every sheet function. Is 
    responsible for sensible error handling!
    """
    @wraps(sheet_function)
    def wrapped_f(*args):
        try:
            return sheet_function(*args)
        except MitoError as e:
            raise e
        except:
            raise make_function_error(sheet_function.__name__, error_modal=False)
    
    return wrapped_f



def convert_arg_to_series_type(
        arg_index: int,
        arg_target_series_type: str, # Union[MITO_SERIES_TYPE, Literal['series']]
        on_uncastable_arg: str, # Literal['error', 'skip']
        on_uncastable_arg_element: Any, #Union[Literal['error'], Tuple[Literal['default'], any]]
        optional: bool=False
    ) -> Callable:
    """
    Wrapper for a sheet function that takes a fixed number of arguments, that takes
    - arg_index, which says which arg to force into which type
    - arg_target_series_type, or which series type to get all arguments into
    - on_uncastable_arg, which is what to do if an entire arg cannot be cast to this type
    - on_uncastable_arg_element, which is what to do when a single element in an arg
      cannot be cast. Include a default value with this function
    - optional, a boolean which allows the argument to be ignored if it is not 
      passed to the sheet function
    """
    def wrap(sheet_function):
        @wraps(sheet_function)
        def wrapped_sheet_function(*args):
            # Cast args to a list, so we can reassign to it (tuples are immutable)
            args = list(args)
            if optional and arg_index >= len(args):
                # If this is an optional argument, and is not passed, then we 
                # just ignore it
                pass
            elif arg_target_series_type == 'series':
                # If we just want any series, that's easy, we turn it into a series, if it is not 
                # already one
                if not isinstance(args[arg_index], pd.Series):
                    args[arg_index] = pd.Series([args[arg_index]])
            else:
                # Otherwise, we actually convert
                conversion_function = get_function_to_convert_to_series(arg_target_series_type)
                try:
                    new_arg = conversion_function(args[arg_index], on_uncastable_arg_element=on_uncastable_arg_element)
                except:
                    if on_uncastable_arg_element == 'error':
                        raise make_invalid_arguments_error(sheet_function.__name__)
                if on_uncastable_arg == 'error' and new_arg is None:
                    raise make_invalid_arguments_error(sheet_function.__name__)
                args[arg_index] = new_arg
            return sheet_function(*args)  
        return wrapped_sheet_function
    return wrap


def convert_args_to_series_type(
        arg_target_series_type: str,
        on_uncastable_arg: str,
        on_uncastable_arg_element: Any,
    ) -> Callable:
    """
    A decorator for functions like SUM or CONCAT, takes:
    - arg_target_series_type, or which series type to get all arguments into
    - on_uncastable_arg, which is what to do if an entire arg cannot be cast to this type
    - on_uncastable_arg_element, which is what to do when a single element in an arg
      cannot be cast. Include a default value with this function
    """

    def wrap(sheet_function):
        @wraps(sheet_function)
        def wrapped_sheet_function(*args):   
            conversion_function = get_function_to_convert_to_series(arg_target_series_type)
            # We partially apply the on_uncastable_arg_element, so that we can map the conversion function
            # over the arguments
            conversion_function = partial(conversion_function, on_uncastable_arg_element=on_uncastable_arg_element)
            new_args = map(conversion_function, args)

            # If any failed to cat, and on_uncastable_arg says to error, we error
            if on_uncastable_arg == 'error' and None in new_args:
                raise make_invalid_arguments_error(sheet_function.__name__)

            # Filter out the None values, as we don't want to send them to the function
            new_args = list(filter(lambda arg: arg is not None, new_args)) 
            return sheet_function(*new_args)        
        return wrapped_sheet_function
    return wrap


def filter_nans(sheet_function: Callable) -> Callable:
    """
    A decorator for functions that do not want to receive any NaN values
    in their input. For every passed series, filters out the indexes that
    is NaN in any series.
    """
    @wraps(sheet_function)
    def wrapped_f(*args):

        original_index, non_nan_index = get_nan_indexes_metadata(*args)
            
        # For each arg that is an instance of a pd.series, filter out the nan_indexes
        new_args = []
        for arg in args:
            if isinstance(arg, pd.Series):
                # We don't filter series of constants, as they are just one element
                if is_series_of_constant(arg):
                    new_args.append(arg)
                else:
                    # Filter out nan indexes from the full series arguments
                    new_args.append(arg[non_nan_index])
            else:
                new_args.append(arg)
            
        result = sheet_function(*new_args)

        return put_nan_indexes_back(result, original_index)
    
    return wrapped_f

def fill_nans(
        arg_index: int,
        new_value: Any,
        optional: bool=False
    ) -> Callable:
    """
    Wrapper for a sheet function that, for a specific argument, fills any NaN values with
    the passed new_value. 

    NOTE: this sometimes makes sense to call before the type casting decorators, and sometimes
    after (depending on what you are trying to accomplish). It does likely make sense to call 
    _after_ the type casting code.
    """
    def wrap(sheet_function):
        @wraps(sheet_function)
        def wrapped_sheet_function(*args):
            # Cast args to a list, so we can reassign to it (tuples are immutable)
            args = list(args)
            if optional and arg_index >= len(args):
                # If this is an optional argument, and is not passed, then we 
                # just ignore it
                pass

            arg = args[arg_index]
            
            # If it's a non-series, and it's a NaN, then just replace it
            if not isinstance(arg, pd.Series) and pd.isna(arg):
                args[arg_index] = new_value
            # Otherwise, if the argument is a series, then we fill all na values
            elif isinstance(arg, pd.Series):
                args[arg_index] = arg.fillna(new_value)
            
            return sheet_function(*args)  
        return wrapped_sheet_function
    return wrap

def cast_output(
        output_target_series_type: str
    ) -> Callable:
    """
    Casts the output of the sheet function to the given type. If 'first_input_type' as given, then
    will cast the output to the type of the first passed argument. 

    If the cast to the output cannot occur or fails, then will return the output
    in the uncast type.

    NOTE: this decorator should always be the first decorator on a function, so that
    it can read in the input type! 
    """

    def wrap(sheet_function):
        @wraps(sheet_function)
        def wrapped_sheet_function(*args):
            if output_target_series_type == 'first_input_type':
                # Turn it into a series, if it is not
                if not isinstance(args[0], pd.Series):
                    series = pd.Series([args[0]])
                else:
                    series = args[0]
                conversion_function = get_function_to_convert_to_series(str(series.dtype))
            else:
                conversion_function = get_function_to_convert_to_series(output_target_series_type)
                        
            result = sheet_function(*args)
            try:
                return conversion_function(result, on_uncastable_arg_element='error')
            except:
                return result
            
        return wrapped_sheet_function
    return wrap
