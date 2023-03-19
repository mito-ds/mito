#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all functions that can be used in a sheet that operate on strings.

NOTE: This file is alphabetical order!
"""
from typing import Optional, Union
import sys
import numpy as np

import pandas as pd

from mitosheet.public.v3.errors import handle_sheet_function_errors
from mitosheet.public.v3.sheet_functions.utils import get_final_result_series_or_primitive
from mitosheet.public.v3.types.decorators import cast_values_in_all_args_to_type, cast_values_in_arg_to_type
from mitosheet.public.v3.types.sheet_function_types import StringInputType, StringRestrictedInputType, StringFunctionReturnType, IntRestrictedInputType


@cast_values_in_arg_to_type('string', 'str')
@cast_values_in_arg_to_type('num_chars', 'int')
@handle_sheet_function_errors
def LEFT(string: StringRestrictedInputType, num_chars: IntRestrictedInputType=None) -> StringFunctionReturnType:
    """
    {
        "function": "LEFT",
        "description": "Returns a substring from the beginning of a specified string.",
        "search_terms": ["left"],
        "examples": [
            "LEFT(A, 2)",
            "LEFT('The first character!')"
        ],
        "syntax": "LEFT(string, [number_of_characters])",
        "syntax_elements": [{
                "element": "string",
                "description": "The string or series from which the left portion will be returned."
            },
            {
                "element": "number_of_characters [OPTIONAL, 1 by default]",
                "description": "The number of characters to return from the start of string."
            }
        ]
    }
    """

    if string is None:
        return ''
    elif isinstance(string, pd.Series):
        string = string.fillna('')

    if num_chars is None:
        num_chars = 1
    elif isinstance(num_chars, pd.Series):
        num_chars = num_chars.fillna(0)


    if isinstance(string, str):
        if isinstance(num_chars, int):
            return string[:num_chars]
        else:
            return pd.Series(
                [string[:nc] for nc in num_chars],
                index=num_chars.index
            )
    else:
        if isinstance(num_chars, int):
            return pd.Series(
                [s[:min(num_chars, len(s))] for s in string],
                index=string.index
            )
        else:
            return pd.Series(
                [s[:nc] for s, nc in zip(string, num_chars)],
                index=string.index
            )


@cast_values_in_all_args_to_type('str')
@handle_sheet_function_errors
def CONCAT(*argv: StringInputType) -> StringFunctionReturnType:
    """
    {
        "function": "CONCAT",
        "description": "Returns the passed strings and series appended together.",
        "search_terms": ["&", "concatenate", "append", "combine"],
        "examples": [
            "CONCAT('Bite', 'the bullet')",
            "CONCAT(A, B)"
        ],
        "syntax": "CONCAT(string1, [string2, ...])",
        "syntax_elements": [{
                "element": "string1",
                "description": "The first string or series."
            },
            {
                "element": "string2, ... [OPTIONAL]",
                "description": "Additional strings or series to append in sequence."
            }
        ]
    }
    """

    return get_final_result_series_or_primitive(
        '',
        argv,
        lambda df: df.sum().sum(), # Concats in the same order as Excel - yay!
        lambda previous_value, new_value: previous_value + new_value,
        lambda previous_series, new_series: previous_series + new_series
    )


# TODO: we should see if we can list these automatically!
STRING_FUNCTIONS = {
    'CONCAT': CONCAT,
}
