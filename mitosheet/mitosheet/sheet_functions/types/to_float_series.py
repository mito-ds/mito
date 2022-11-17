#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
For going to a float series.
"""
from typing import Any

import numpy as np
import pandas as pd
from mitosheet.sheet_functions.types.utils import (
    get_billion_identifier_in_string, get_million_identifier_in_string,
    is_bool_dtype, is_datetime_dtype, is_number_dtype, is_string_dtype)
from typing import Any


def convert_string_to_float(
        s: str, 
        on_uncastable_arg_element: Any, #Union[Literal['error'], Tuple[Literal['default'], any]]
    ) -> pd.Series:
    """
    NOTE: The approach for this function is to start as a string, and then we try
    and turn each element into a number 1-by-1. We attempt to handle:
    1. All basic integers / floats.
    2. Dollar signs. 
    3. Parenthases to denote negative numbers, per accounting conventions. 
    4. Commas in the string (e.g. 123,456 => 123456). NOTE: We handle the European conventions here too, 
        where commas may represent a decimal. However, this is impossible to make perfect, as 123,123 and
        123,123 are 123123 and 123.123 in America and Europe respectively. We treat this as American for 
        now. 
    5. Million or Billion identifier in the string
    As these are all heuristics, we do our best. We also try to perform this conversion
    optimistically, as to run as quickly as possible.
    """
    try:
        # Try to handle case 1, optimistically
        return float(s)
    except:
        # Get rid of whitespace at the ends
        s = s.strip()

        is_negative = False
        if s.startswith('-'):
            s = s[1:]
            is_negative = True

        # Handle 2, if it exist
        if s.startswith('$'):
            s = s[1:]

        # Handle 3, if it exists
        if s.startswith('(') and s.endswith(')'):
            s = s[1:-1]
            is_negative = True

        # Handle case 4, if it's an issue
        if ',' in s:
            # We try and figure out if it's a european or american comma usage, by seeing
            # what happens at the end of the string
            last_comma_index = s.rfind(',')

            # If there is no period, and the the string after the last comma is anything other
            # than 3 characters long, than we take this as a European, and turn the comma into a .
            if '.' not in s and last_comma_index != len(s) - 4:
                s = s.replace(',', '.')
            else:
                # Otherwise, we treat this as American
                s = s.replace(',', '')

        # Handle case 5, if there is a million or billion identifier in the number
        million_identifer = get_million_identifier_in_string(s)
        billion_identifier = get_billion_identifier_in_string(s)
        multiplier = 1

        if million_identifer != None:
            multiplier = 1000000
            s = s.replace(million_identifer, '') # type: ignore

        if billion_identifier != None:
            multiplier = 1000000000
            s = s.replace(billion_identifier, '') # type: ignore

        try:
            return float(s) * (-1 if is_negative else 1) * multiplier
        except:
            if on_uncastable_arg_element == 'error':
                # TODO: raise a better exception
                raise Exception('Invalid element')
            else:
                # Return the given default value in this case
                return on_uncastable_arg_element[1]

def to_float_series_from_string_series(
        string_series: pd.Series, 
        on_uncastable_arg_element: Any #: Union[Literal['error'], Tuple[Literal['default'], any]]
    ) -> pd.Series:
    """
    Converts a string series to a number series, using a helper that
    handles special formatting of strings. 

    Takes a default value, so the tranformation can occur elementwise
    """
    return string_series.apply(convert_string_to_float, on_uncastable_arg_element=on_uncastable_arg_element).astype('float64')

def to_float_series_from_boolean_series(boolean_series: pd.Series) -> pd.Series:
    """
    As all boolean series are very easily convertable to a number_series, 
    and cannot fail on any element, so we can do this in one easy move.

    Note that False -> 0, and True -> 1.
    """
    return boolean_series.astype('float64')


def to_float_series(
        unknown_object: Any,
        on_uncastable_arg_element: Any=('default', np.NaN), # Union[Literal['error'], Tuple[Literal['default'], any]]
    ) -> pd.Series:

    # If it is not a series, we put it in a series, and get the type again
    if not isinstance(unknown_object, pd.Series):
        unknown_object = pd.Series([unknown_object])

    column_dtype = str(unknown_object.dtype)
    if is_bool_dtype(column_dtype):
        return to_float_series_from_boolean_series(unknown_object)
    elif is_datetime_dtype(column_dtype):
        return None
    elif is_number_dtype(column_dtype):
        return unknown_object
    elif is_string_dtype(column_dtype):
        return to_float_series_from_string_series(unknown_object, on_uncastable_arg_element=on_uncastable_arg_element)
    else:
        return None
