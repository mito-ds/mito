#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Utilities to help with type functions
"""

from typing import Any, List, Optional, Tuple, Union
import pandas as pd
import numpy as np

from mitosheet.sheet_functions.sheet_function_utils import is_series_of_constant

# A series of helper functions that help you figure
# out which dtype we're dealing with. NOTE: since some
# of these types can be different varieties (e.g. int can be int64, uint64)
# we try to check for them with simple expressions
# NOTE: these should be identical to the TS utilities in dtypes.tsx

def is_bool_dtype(dtype: str) -> bool:
    return 'bool' == dtype

def is_int_dtype(dtype: str) -> bool:
    return 'int' in dtype

def is_float_dtype(dtype: str) -> bool:
    return 'float' in dtype

def is_string_dtype(dtype: str) -> bool:
    return dtype == 'object' or dtype == 'str' or dtype == 'string'

def is_datetime_dtype(dtype: str) -> bool:
    # NOTE: this should handle all different datetime columns, no matter
    # the timezone, as it checks for string inclusion
    return 'datetime' in dtype

def is_timedelta_dtype(dtype: str) -> bool:
    return 'timedelta' in dtype

def is_number_dtype(dtype: str) -> bool:
    return is_int_dtype(dtype) or is_float_dtype(dtype)

def is_none_type(value: Union[str, None]) -> bool:
    """
    Helper function for determining if a value should be treated as None
    """
    return True if value is None or str(value).lower() in ['nan', 'nat'] else False

def get_float_dt_td_columns(df: pd.DataFrame) -> Tuple[List[Any], List[Any], List[Any]]:
    float_columns, date_columns, timedelta_columns = [], [], []
    for column_header in df.columns:
        dtype = str(df[column_header].dtype)
        # NOTE: these functions are called frequently, so we put them in 
        # the order they are most likely to be true in, so we can short out
        if is_float_dtype(dtype):
            float_columns.append(column_header)
        elif is_datetime_dtype(dtype):
            date_columns.append(column_header)
        elif is_timedelta_dtype(dtype):
            timedelta_columns.append(column_header)

    return float_columns, date_columns, timedelta_columns


def get_nan_indexes_metadata(*argv: pd.Series) -> Tuple[pd.Index, pd.Index]: 
    """
    Given a list of series, this function returns data that is helpful
    in figuring out which of the rows of these series have a NaN in them.

    The data returned allows you to remove the nan values from the series,
    so that they can then be easily used by sheet functions, but also to
    easily add these NaN values back to the series in the correct location.

    It does so by returning a tuple of the original_index, non_nan_index 
    """
    nan_index_set = set()
    non_nan_index_set = set()
    original_index = None

    for arg in argv:
        if isinstance(arg, pd.Series): 
            nan_index_set.update(arg[arg.isnull()].index)
            non_nan_index_set.update(arg[~arg.isnull()].index)

            # Update the original indexes to the first element, if we haven't
            # selected one yet
            if original_index is None:
                original_index = arg.index
            elif not is_series_of_constant(arg):
                original_index = arg.index

    # Remove any index that was nan at any point
    non_nan_index_set.difference_update(nan_index_set)
    non_nan_index = pd.Index(list(non_nan_index_set))

    return original_index, non_nan_index 

def put_nan_indexes_back(series: pd.Series, original_index: pd.Index) -> pd.Series:
    """
    This function takes a series, as well as a set of the indexes
    that are are NaN, and inserts these indexes back into the series
    as NaN values.
    """
    return series.reindex(original_index)


def get_datetime_format(string_series: pd.Series) -> Optional[str]:
    """
    Given a series of datetime strings, guesses the most likely date format.
    """
    try:
        # Import log function here to avoid circular import
        from mitosheet.telemetry.telemetry_utils import log

        # If we can convert all non null inputs, then we assume we guessed correctly
        non_null_inputs = string_series[~string_series.isna()]

        # First try letting pandas guess the correct datetime
        converted = pd.to_datetime(non_null_inputs, errors='coerce', infer_datetime_format=True)
        if converted.isna().sum() == 0:
            return None

        # TODO: Add the most popular formats to here and check them first before 
        # trying all of the formats below for performance.

        # Then we try a bunch of other formats it could be
        sample_string_datetime = string_series[string_series.first_valid_index()]
        FORMATS = [
            '%m{s}%d{s}%Y', 
            '%d{s}%m{s}%Y', 
            '%Y{s}%d{s}%m', 
            '%Y{s}%m{s}%d', 
            '%m{s}%d{s}%Y %H:%M:%S', 
            '%d{s}%m{s}%Y  %H:%M:%S', 
            '%Y{s}%d{s}%m  %H:%M:%S', 
            '%Y{s}%m{s}%d  %H:%M:%S'
        ]
        SEPERATORS = ['/', '-', '.', ',', ':', ' ', '']

        for seperator in SEPERATORS:
            if seperator in sample_string_datetime:
                for _format in FORMATS:
                    format = _format.format(s=seperator)
                    if test_datetime_format(non_null_inputs, format):
                        return format  

        log('unable_to_determine_datetime_format_on_cast')
        return None
    except:
        log('unable_to_determine_datetime_format_on_cast')
        return None


def test_datetime_format(series: pd.Series, _format: str) -> bool:
    converted = pd.to_datetime(series, errors='coerce', format=_format)
    return converted.isna().sum() == 0
        

def get_million_identifier_in_string(string: str) -> Union[str, None]:
    """
    Given a string, returns the million identifier in it. 
    Returns '' if none exist. 
    """
    million_identifiers = ["Million", 'Mil', 'M', 'million', 'mil', 'm']
    # So that we return the biggest matching element
    million_identifiers = list(sorted(million_identifiers, key = len, reverse=True))

    for identifier in million_identifiers:
        if identifier in string:
            return identifier

    return None


def get_billion_identifier_in_string(string: str) -> Union[str, None]:
    """
    Given a string, returns the billion identifier in it. 
    Returns '' if none exist. 
    """

    billion_identifiers = ["Billion", 'Bil', 'B', 'billion', 'bil', 'b']
    # So that we return the biggest matching element
    billion_identifiers = list(sorted(billion_identifiers, key = len, reverse=True))

    for identifier in billion_identifiers:
        if identifier in string:
            return identifier

    return None