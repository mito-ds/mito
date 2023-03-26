#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all functions that can be used in a sheet that operate on strings.

NOTE: This file is alphabetical order!
"""
from typing import Callable, Optional, Union
import sys
import numpy as np

import pandas as pd

from mitosheet.public.v3.errors import handle_sheet_function_errors
from mitosheet.public.v3.sheet_functions.utils import get_final_result_series_or_primitive
from mitosheet.public.v3.types.decorators import cast_values_in_all_args_to_type, cast_values_in_arg_to_type
from mitosheet.public.v3.types.sheet_function_types import StringInputType, StringRestrictedInputType, StringFunctionReturnType, IntRestrictedInputType, IntFunctionReturnType


@cast_values_in_arg_to_type('series', 'str')
@handle_sheet_function_errors
def CLEAN(series: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "CLEAN",
        "description": "Returns the text with the non-printable ASCII characters removed.",
        "search_terms": ["clean", "trim", "remove"],
        "examples": [
            "CLEAN(A)"
        ],
        "syntax": "CLEAN(string)",
        "syntax_elements": [{
                "element": "string",
                "description": "The string or series whose non-printable characters are to be removed."
            }
        ]
    }
    """
    clean_helper: Callable[[str], str] = lambda x:''.join([i if 32 <= ord(i) < 126 else "" for i in x])

    if series is None:
        return ''
    elif isinstance(series, str):
        return clean_helper(series)
    
    return series.fillna('').apply(clean_helper)


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

@cast_values_in_arg_to_type('string', 'str')
@cast_values_in_arg_to_type('substrings', 'str')
@handle_sheet_function_errors
def FIND(string: StringRestrictedInputType, substrings: StringRestrictedInputType) -> IntFunctionReturnType:
    """
    {
        "function": "FIND",
        "description": "Returns the position at which a string is first found within text, case-sensitive. Returns 0 if not found.",
        "search_terms": ["find", "search"],
        "examples": [
            "FIND(A, 'Jack')",
            "FIND('Ben has a friend Jack', 'Jack')"
        ],
        "syntax": "FIND(text_to_search, search_for)",
        "syntax_elements": [{
                "element": "text_to_search",
                "description": "The text or series to search for the first occurrence of search_for."
            },
            {
                "element": "search_for",
                "description": "The string to look for within text_to_search."
            }
        ]
    }
    """
    if string is None:
        return 0
    elif isinstance(string, pd.Series):
        string = string.fillna('')

    if substrings is None:
        return 0
    elif isinstance(substrings, pd.Series):
        substrings = substrings.fillna('XTREME_MITOSHEET_NULL_VALUE_1234567890_0987654321_NULL_VALUE_MITOSHEET_XTREME') # This is a hack to make sure that the find function returns 0 for null values

    if isinstance(string, str) and isinstance(substrings, str):
        if substrings == '':
            return 1
        
        return string.find(substrings) + 1
    
    # otherwise, turn them into series
    index = string.index if isinstance(string, pd.Series) else substrings.index
    if isinstance(string, str):
        string = pd.Series([string] * len(substrings), index=index)
    elif isinstance(substrings, str):
        substrings = pd.Series([substrings] * len(string), index=index)
    
    return pd.Series(
        [s.find(ss) + 1 for s, ss in zip(string, substrings)],
        index=index
    )


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
                [s[:min(nc, len(s))] for s, nc in zip(string, num_chars)], #TODO: add test for this min
                index=string.index
            )



@cast_values_in_arg_to_type('string', 'str')
@handle_sheet_function_errors
def LEN(string: StringRestrictedInputType) -> IntFunctionReturnType:
    """
    {
        "function": "LEN",
        "description": "Returns the length of a string.",
        "search_terms": ["length", "size"],
        "examples": [
            "LEN(A)",
            "LEN('This is 21 characters')"
        ],
        "syntax": "LEN(string)",
        "syntax_elements": [{
                "element": "string",
                "description": "The string or series whose length will be returned."
            }
        ]
    }
    """
    if string is None:
        return 0
    elif isinstance(string, str):
        return len(string)
    
    return string.fillna('').str.len()


@cast_values_in_arg_to_type('series', 'str')
@handle_sheet_function_errors
def LOWER(series: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "LOWER",
        "description": "Converts a given string to lowercase.",
        "search_terms": ["lowercase", "uppercase"],
        "examples": [
            "=LOWER('ABC')",
            "=LOWER(A)",
            "=LOWER('Nate Rush')"
        ],
        "syntax": "LOWER(string)",
        "syntax_elements": [{
                "element": "string",
                "description": "The string or series to convert to lowercase."
            }
        ]
    }
    """
    if series is None:
        return ''
    elif isinstance(series, str):
        return series.lower()

    return series.fillna('').str.lower()



@cast_values_in_arg_to_type('string', 'str')
@cast_values_in_arg_to_type('start_loc', 'int')
@cast_values_in_arg_to_type('num_chars', 'int')
@handle_sheet_function_errors
def MID(string: StringRestrictedInputType, start_loc: IntRestrictedInputType, num_chars: IntRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "MID",
        "description": "Returns a segment of a string.",
        "search_terms": ["middle"],
        "examples": [
            "MID(A, 2, 2)",
            "MID('Some middle characters!', 3, 4)"
        ],
        "syntax": "MID(string, starting_at, extract_length)",
        "syntax_elements": [{
                "element": "string",
                "description": "The string or series to extract the segment from."
            },
            {
                "element": "starting_at",
                "description": "The index from the left of string from which to begin extracting."
            },
            {
                "element": "extract_length",
                "description": "The length of the segment to extract."
            }
        ]
    }
    """

    if string is None:
        return ''
    elif isinstance(string, pd.Series):
        string = string.fillna('')

    if start_loc is None:
        start_loc = 0
    elif isinstance(start_loc, pd.Series):
        start_loc = start_loc.fillna(0)

    if num_chars is None:
        num_chars = 1
    elif isinstance(num_chars, pd.Series):
        num_chars = num_chars.fillna(0)


    if isinstance(string, str) and isinstance(start_loc, int) and isinstance(num_chars, int):
        return string[start_loc - 1:start_loc + num_chars - 1]

    # Turn all of them into a series to simplify things
    index = string.index if isinstance(string, pd.Series) else start_loc.index if isinstance(start_loc, pd.Series) else num_chars.index # type: ignore
    if isinstance(string, str):
        string = pd.Series([string] * len(index), index=index)
    if isinstance(start_loc, int):
        start_loc = pd.Series([start_loc] * len(index), index=index)
    if isinstance(num_chars, int):
        num_chars = pd.Series([num_chars] * len(index), index=index)
    
    return pd.Series(
        [s[sl-1:sl+nc-1] for s, sl, nc in zip(string, start_loc, num_chars)],
        index=index
    )


@cast_values_in_arg_to_type('series', 'str')
@handle_sheet_function_errors
def PROPER(series: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "PROPER",
        "description": "Capitalizes the first letter of each word in a specified string.",
        "search_terms": ["proper", "capitalize"],
        "examples": [
            "=PROPER('nate nush')",
            "=PROPER(A)"
        ],
        "syntax": "PROPER(string)",
        "syntax_elements": [{
                "element": "string",
                "description": "The value or series to convert to convert to proper case."
            }
        ]
    }
    """
    if series is None:
        return ''
    elif isinstance(series, str):
        return series.title()

    return series.fillna('').str.title()


@cast_values_in_arg_to_type('string', 'str')
@cast_values_in_arg_to_type('num_chars', 'int')
@handle_sheet_function_errors
def RIGHT(string: StringRestrictedInputType, num_chars: IntRestrictedInputType=None) -> StringFunctionReturnType:

    """
    {
        "function": "RIGHT",
        "description": "Returns a substring from the beginning of a specified string.",
        "search_terms": [],
        "examples": [
            "RIGHT(A, 2)",
            "RIGHT('The last character!')"
        ],
        "syntax": "RIGHT(string, [number_of_characters])",
        "syntax_elements": [{
                "element": "string",
                "description": "The string or series from which the right portion will be returned."
            },
            {
                "element": "number_of_characters [OPTIONAL, 1 by default]",
                "description": "The number of characters to return from the end of string."
            }
        ]
    }
    """
    right_helper: Callable[[str, int], str] = lambda s, nc: s[-min(nc, len(s)):] if nc != 0 else ''

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
            return right_helper(string, num_chars)
        else:
            return pd.Series(
                [right_helper(string, nc) for nc in num_chars],
                index=num_chars.index
            )
    else:
        if isinstance(num_chars, int):
            return pd.Series(
                [right_helper(s, num_chars) for s in string],
                index=string.index
            )
        else:
            return pd.Series(
                [right_helper(s, nc) for s, nc in zip(string, num_chars)],
                index=string.index
            )


@cast_values_in_arg_to_type('string', 'str')
@cast_values_in_arg_to_type('old_text', 'str')
@cast_values_in_arg_to_type('new_text', 'str')
@cast_values_in_arg_to_type('count', 'int')
@handle_sheet_function_errors
def SUBSTITUTE(string: StringRestrictedInputType, old_text: StringRestrictedInputType, new_text: StringRestrictedInputType, count: IntRestrictedInputType=None) -> StringFunctionReturnType:
    """
    {
        "function": "SUBSTITUTE",
        "description": "Replaces existing text with new text in a string.",
        "search_terms": ["replace", "find and replace"],
        "examples": [
            "SUBSTITUTE('Better great than never', 'great', 'late')",
            "SUBSTITUTE(A, 'dog', 'cat')"
        ],
        "syntax": "SUBSTITUTE(text_to_search, search_for, replace_with, [count])",
        "syntax_elements": [{
                "element": "text_to_search",
                "description": "The text within which to search and replace."
            },
            {
                "element": "search_for",
                "description": " The string to search for within text_to_search."
            },
            {
                "element": "replace_with",
                "description": "The string that will replace search_for."
            },
            {
                "element": "count",
                "description": "The number of times to perform the substitute. Default is all."
            }
        ]
    }
    """
    if string is None:
        return ''
    elif isinstance(string, pd.Series):
        string = string.fillna('')

    if old_text is None:
        return string
    elif isinstance(old_text, pd.Series):
        old_text = old_text.fillna('')

    if new_text is None:
        return string
    elif isinstance(new_text, pd.Series):
        new_text = new_text.fillna('')

    if count is None:
        count = -1
    elif isinstance(count, pd.Series):
        count = count.fillna(0)


    if isinstance(string, str) and isinstance(old_text, str) and isinstance(new_text, str) and isinstance(count, int):
        return string.replace(old_text, new_text, count)
    else:
        # To make the cases easier here, we'll just convert everything to a series of the same length if any of them are a series
        index = string.index if isinstance(string, pd.Series) else old_text.index if isinstance(old_text, pd.Series) else new_text.index if isinstance(new_text, pd.Series) else count.index if isinstance(count, pd.Series) else []
        if isinstance(string, str):
            string = pd.Series([string] * len(index), index=index)
        if isinstance(old_text, str):
            old_text = pd.Series([old_text] * len(index), index=index)
        if isinstance(new_text, str):
            new_text = pd.Series([new_text] * len(index), index=index)
        if isinstance(count, int):
            count = pd.Series([count] * len(index), index=index)


        return pd.Series(
            [s.replace(ot, nt, c) for s, ot, nt, c in zip(string, old_text, new_text, count)],
            index=index
        )
    

@cast_values_in_arg_to_type('series', 'str')
@handle_sheet_function_errors
def TEXT(series: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "TEXT",
        "description": "Turns the passed series into a string.",
        "search_terms": ["string", "dtype"],
        "examples": [
            "=TEXT(Product_Number)",
            "=TEXT(Start_Date)"
        ],
        "syntax": "TEXT(series)",
        "syntax_elements": [{
                "element": "series",
                "description": "The series to convert to a string."
            }
        ]
    }
    """
    if series is None:
        return ''
    elif isinstance(series, str):
        return series
    
    return series.fillna('')

@cast_values_in_arg_to_type('series', 'str')
@handle_sheet_function_errors
def TRIM(series: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "TRIM",
        "description": "Returns a string with the leading and trailing whitespace removed.",
        "search_terms": ["trim", "whitespace", "spaces"],
        "examples": [
            "=TRIM('  ABC')",
            "=TRIM('  ABC  ')",
            "=TRIM(A)"
        ],
        "syntax": "TRIM(string)",
        "syntax_elements": [{
                "element": "string",
                "description": "The value or series to remove the leading and trailing whitespace from."
            }
        ]
    }
    """
    if series is None:
        return ''
    elif isinstance(series, str):
        return series.strip()

    return series.fillna('').str.strip()


@cast_values_in_arg_to_type('series', 'str')
@handle_sheet_function_errors
def UPPER(series: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "UPPER",
        "description": "Converts a given string to uppercase.",
        "search_terms": ["uppercase", "capitalize"],
        "examples": [
            "=UPPER('abc')",
            "=UPPER(A)",
            "=UPPER('Nate Rush')"
        ],
        "syntax": "UPPER(string)",
        "syntax_elements": [{
                "element": "string",
                "description": "The string or series to convert to uppercase."
            }
        ]
    }
    """
    if series is None:
        return ''
    elif isinstance(series, str):
        return series.upper()
    
    return series.fillna('').str.upper()



# TODO: we should see if we can list these automatically!
STRING_FUNCTIONS = {
    'CLEAN': CLEAN,
    'CONCAT': CONCAT,
    'FIND': FIND,
    'LEFT': LEFT,
    'LEN': LEN,
    'LOWER': LOWER,
    'MID': MID,
    'PROPER': PROPER,
    'RIGHT': RIGHT,
    'SUBSTITUTE': SUBSTITUTE,
    'TEXT': TEXT,
    'TRIM': TRIM,
    'UPPER': UPPER,
}
