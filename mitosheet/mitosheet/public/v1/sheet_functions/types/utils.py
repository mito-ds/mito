#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Utilities to help with type functions
"""

from distutils.version import LooseVersion
from typing import Any, Dict, List, Optional, Tuple, Union
import pandas as pd
import numpy as np

from mitosheet.public.v1.sheet_functions.sheet_function_utils import is_series_of_constant


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


def get_to_datetime_params(string_series: pd.Series) -> Dict[str, Any]:

    detected_format = get_datetime_format(string_series)

    # If we detect a format, we return that. This works for all pandas versions
    if detected_format is not None:
        return {
            'format': detected_format
        }
    

    # If pandas < 2.0, we can use infer_datetime_format
    if LooseVersion(pd.__version__) < LooseVersion('2.0'):
        return {
            'infer_datetime_format': True
        }
    
    # Otherwise, we mark the format as mixed
    return {
        'format': 'mixed'
    }


def get_datetime_format(string_series: pd.Series) -> Optional[str]:
    """
    Given a series of datetime strings, guesses the most likely date format.
    """
    # Import log function here to avoid circular import
    from mitosheet.telemetry.telemetry_utils import log

    # If we can convert all non null inputs, then we assume we guessed correctly
    non_null_inputs = string_series[~string_series.isna()]

    # If we're on a older verison of pandas, we just check if infer_datetime_format=True works
    if LooseVersion(pd.__version__) < LooseVersion('2.0'):
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
        '%Y{s}%m{s}%d', 
        '%Y{s}%d{s}%m', 
        '%d{s}%m{s}%Y  %H:%M:%S', 
        '%m{s}%d{s}%Y %H:%M:%S', 
        '%Y{s}%m{s}%d  %H:%M:%S',
        '%Y{s}%d{s}%m  %H:%M:%S', 
    ]
    SEPERATORS = ['/', '-', '.', ',', ':', ' ', '']

    for seperator in SEPERATORS:
        if seperator in sample_string_datetime:
            for _format in FORMATS:
                format = _format.format(s=seperator)
                # If we fail to convert to a specific format,keep trying
                try:
                    if test_datetime_format(non_null_inputs, format):
                        return format
                except:
                    pass

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