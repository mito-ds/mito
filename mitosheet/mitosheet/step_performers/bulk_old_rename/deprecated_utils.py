#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

"""
NOTE: DO NOT CHANGE THIS FILE. THESE ARE DEPRECATED UTILS
THAT CANNOT CHANGE AND SO SHOULD NEVER BE CHANGED.
"""

import numbers
import re
from typing import Any, Callable, Dict, List
from mitosheet.mito_analytics import log

import pandas as pd

import warnings
import functools

from mitosheet.types import ColumnHeader

def deprecated(func: Callable) -> Callable:
    """
    This is a decorator which can be used to mark functions
    as deprecated. It will result in a warning being emitted
    when the function is used. It should be used on all 
    external functions that are deprecated.

    Taken from here: https://stackoverflow.com/questions/2536307/decorators-in-the-python-standard-lib-deprecated-specifically
    """
    @functools.wraps(func)
    def new_func(*args, **kwargs):
        warnings.simplefilter('always', DeprecationWarning)  # turn off filter
        warnings.warn("Call to deprecated function {}. Support for this function will be removed in the coming months.".format(func.__name__),
                      category=DeprecationWarning,
                      stacklevel=2)
        warnings.simplefilter('default', DeprecationWarning)  # reset filter
        # Log the call
        log('used_deprecated_function', {'function_name': func.__name__})
        return func(*args, **kwargs)
    return new_func


def make_valid_header(column_header: Any) -> str:
    """
    Takes a header, and performs replaces against common characters
    to make the column_header valid!

    NOTE: DO NOT CHANGE THIS FILE. THESE ARE DEPRECATED UTILS
    THAT CANNOT CHANGE AND SO SHOULD NEVER BE CHANGED.
    """
    # If it's a tuple, we turn it into a string before continuing
    if isinstance(column_header, tuple):
        column_header = '_'.join([str(c) for c in column_header]).strip()

    # If it's just numbers, turn it into a string (with an underscore)
    if isinstance(column_header, numbers.Number):
        return str(column_header).replace('.', '_') + '_'

    # If it's just numbers in a string, add an underscore
    if column_header.isdigit():
        return column_header + "_"

    # Replace common invalid seperators with valid seperators
    replace_dict = {
        ' ': '_',
        '-': '_',
        '(': '_',
        ')': '_',
        '/': '_',
        '#': 'num',
        ',': '_',
        '.': '_',
        '!': '_',
        '?': '_'
    }
    for find, replace in replace_dict.items():
        column_header = column_header.replace(find, replace)
    
    if not is_valid_header(column_header):
        # Because we detect column headers using a word match, any word character counts
        # in a valid character
        pattern = re.compile("\w")

        new_header = ''.join([
            c for c in column_header if pattern.search(c)
        ])
        if not is_valid_header(new_header):
            # And then append an underscore, for good measure, and this should fix it!
            new_header = new_header + '_'

        return new_header
    return column_header

# We create an external version of the make_valid_header, which we
# export in 
make_valid_header_external = deprecated(make_valid_header)


def is_valid_header(column_header: ColumnHeader) -> bool:
    """
    A header is valid if it is a string that is made up of all word characters,
    with at least one non numeric char, and has at least one char.
    Valid examples: A, ABC, 012B, 213_bac, 123_123
    Invalid examples: 123, 123!!!, ABC!, 123-123
    This is a result of not being able to distingush column headers from constants
    otherwise, and would not be necessary if we had a column identifier!

    NOTE: DO NOT CHANGE THIS FILE. THESE ARE DEPRECATED UTILS
    THAT CANNOT CHANGE AND SO SHOULD NEVER BE CHANGED.
    """
    
    # Note the start and end characters in the regex, to make sure it's a full match
    return isinstance(column_header, str) and \
        len(column_header) > 0 and \
        re.compile("^\w+$").search(column_header) and \
        not column_header.isdigit() # type: ignore

def get_invalid_headers(df: pd.DataFrame) -> List[Any]:
    """
    Given a dataframe, returns a list of all the invalid headers this list has. 

    NOTE: DO NOT CHANGE THIS FILE. THESE ARE DEPRECATED UTILS
    THAT CANNOT CHANGE AND SO SHOULD NEVER BE CHANGED.
    """
    return [
        header for header in df.columns.tolist()
        if not is_valid_header(header)
    ]

def get_header_renames(column_headers: List[ColumnHeader]) -> Dict[Any, str]:
    """
    Given a list of column headers, returns a mapping from old, invalid headers to
    new, valid headers. Empty if no renames are necessary.

    NOTE: DO NOT CHANGE THIS FILE. THESE ARE DEPRECATED UTILS
    THAT CANNOT CHANGE AND SO SHOULD NEVER BE CHANGED.
    """
    renames = dict()
    for column_header in column_headers:
        if not is_valid_header(column_header):
            valid_header = make_valid_header(column_header)
            renames[column_header] = valid_header

    return renames
