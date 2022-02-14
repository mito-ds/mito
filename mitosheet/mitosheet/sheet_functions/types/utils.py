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
    Given a series of datetime strings, detects if the format is MM-DD-YYYY,
    which is the most common format that pandas does not default to.

    In the future, we can extend this to detect other formats. Returns None
    if infer_datetime_format is good enough!
    """
    try:
        # If we can convert all non null inputs, then we assume that pandas
        # is guessing the input correctly
        non_null_inputs = string_series[~string_series.isna()]
        converted = pd.to_datetime(non_null_inputs, errors='coerce', infer_datetime_format=True)
        if converted.isna().sum() > 0:
            raise Exception("Non full conversion")
        return None
    except:
        # Otherwise, we manually figure out the format.
        sample_string_datetime = string_series[string_series.first_valid_index()]
        if "/" in sample_string_datetime: 
            return '%m/%d/%Y'
        else:
            return '%m-%d-%Y'


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