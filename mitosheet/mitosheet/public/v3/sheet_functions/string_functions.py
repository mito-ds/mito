#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all functions that can be used in a sheet that operate on strings.

NOTE: This file is alphabetical order!
"""
from typing import Callable, Optional

import pandas as pd

from mitosheet.public.v3.errors import handle_sheet_function_errors
from mitosheet.public.v3.sheet_functions.utils import (
    get_final_result_series_or_primitive, get_index_from_series,
    get_series_from_primitive_or_series)
from mitosheet.public.v3.types.decorators import (
    cast_values_in_all_args_to_type, cast_values_in_arg_to_type)
from mitosheet.public.v3.types.sheet_function_types import (
    IntFunctionReturnType, IntRestrictedInputType, StringFunctionReturnType,
    StringInputType, StringRestrictedInputType)


@cast_values_in_arg_to_type('arg', 'str')
@handle_sheet_function_errors
def CLEAN(arg: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "CLEAN",
        "description": "Returns the text with the non-printable ASCII characters removed.",
        "search_terms": ["clean", "trim", "remove"],
        "category": "TEXT",
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

    if isinstance(arg, str):
        return clean_helper(arg)
    
    return arg.fillna('').apply(clean_helper)


@cast_values_in_all_args_to_type('str')
@handle_sheet_function_errors
def CONCAT(*argv: StringInputType) -> StringFunctionReturnType:
    """
    {
        "function": "CONCAT",
        "description": "Returns the passed strings and series appended together.",
        "search_terms": ["&", "concatenate", "append", "combine"],
        "category": "TEXT",
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
        "category": "TEXT",
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

    if isinstance(string, str) and isinstance(substrings, str):
        if substrings == '':
            return 1
        
        return string.find(substrings) + 1

    # otherwise, turn them into series
    index = get_index_from_series(string, substrings)
    string = get_series_from_primitive_or_series(string, index).fillna('')
    substrings = get_series_from_primitive_or_series(substrings, index).fillna('XTREME_MITOSHEET_NULL_VALUE_1234567890_0987654321_NULL_VALUE_MITOSHEET_XTREME') # This is a hack to make sure that the find function returns 0 for null values
    
    return pd.Series(
        [s.find(ss) + 1 for s, ss in zip(string, substrings)],
        index=index
    )


@cast_values_in_arg_to_type('string', 'str')
@cast_values_in_arg_to_type('num_chars', 'int')
@handle_sheet_function_errors
def LEFT(string: StringRestrictedInputType, num_chars: Optional[IntRestrictedInputType]=None) -> StringFunctionReturnType:
    """
    {
        "function": "LEFT",
        "description": "Returns a substring from the beginning of a specified string.",
        "search_terms": ["left"],
        "category": "TEXT",
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

    left_helper: Callable[[str, int], str] = lambda s, nc: s[:min(nc, len(s))]

    if num_chars is None:
        num_chars = 1

    if isinstance(string, str) and isinstance(num_chars, int):
        return left_helper(string, num_chars)

    # otherwise, turn them into series for simplicity
    index = get_index_from_series(string, num_chars)
    string = get_series_from_primitive_or_series(string, index).fillna('')
    num_chars = get_series_from_primitive_or_series(num_chars, index).fillna(0)

    return pd.Series(
        [left_helper(s, nc) for s, nc in zip(string, num_chars)],
        index=string.index
    )



@cast_values_in_arg_to_type('arg', 'str')
@handle_sheet_function_errors
def LEN(arg: StringRestrictedInputType) -> IntFunctionReturnType:
    """
    {
        "function": "LEN",
        "description": "Returns the length of a string.",
        "search_terms": ["length", "size"],
        "category": "TEXT",
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
    if isinstance(arg, str):
        return len(arg)
    
    return arg.fillna('').str.len()


@cast_values_in_arg_to_type('arg', 'str')
@handle_sheet_function_errors
def LOWER(arg: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "LOWER",
        "description": "Converts a given string to lowercase.",
        "search_terms": ["lowercase", "uppercase"],
        "category": "TEXT",
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
    if isinstance(arg, str):
        return arg.lower()

    return arg.fillna('').str.lower()



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
        "category": "TEXT",
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

    if isinstance(string, str) and isinstance(start_loc, int) and isinstance(num_chars, int):
        return string[start_loc - 1:start_loc + num_chars - 1]

    # Turn all of them into a series to simplify things
    index = get_index_from_series(string, start_loc, num_chars)
    string = get_series_from_primitive_or_series(string, index).fillna('')
    start_loc = get_series_from_primitive_or_series(start_loc, index).fillna(0)
    num_chars = get_series_from_primitive_or_series(num_chars, index).fillna(0)
    
    return pd.Series(
        [s[sl-1:sl+nc-1] for s, sl, nc in zip(string, start_loc, num_chars)],
        index=index
    )


@cast_values_in_arg_to_type('arg', 'str')
@handle_sheet_function_errors
def PROPER(arg: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "PROPER",
        "description": "Capitalizes the first letter of each word in a specified string.",
        "search_terms": ["proper", "capitalize"],
        "category": "TEXT",
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
    if isinstance(arg, str):
        return arg.title()

    return arg.fillna('').str.title()


@cast_values_in_arg_to_type('string', 'str')
@cast_values_in_arg_to_type('num_chars', 'int')
@handle_sheet_function_errors
def RIGHT(string: StringRestrictedInputType, num_chars: Optional[IntRestrictedInputType]=None) -> StringFunctionReturnType:

    """
    {
        "function": "RIGHT",
        "description": "Returns a substring from the beginning of a specified string.",
        "search_terms": [],
        "category": "TEXT",
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

    if num_chars is None:
        num_chars = 1

    if isinstance(string, str) and isinstance(num_chars, int):
        return right_helper(string, num_chars)
    
    index = get_index_from_series(string, num_chars)
    string = get_series_from_primitive_or_series(string, index).fillna('')
    num_chars = get_series_from_primitive_or_series(num_chars, index).fillna(0)

    return pd.Series(
        [right_helper(s, nc) for s, nc in zip(string, num_chars)],
        index=string.index
    )


@cast_values_in_arg_to_type('string', 'str')
@cast_values_in_arg_to_type('old_text', 'str')
@cast_values_in_arg_to_type('new_text', 'str')
@cast_values_in_arg_to_type('count', 'int')
@handle_sheet_function_errors
def SUBSTITUTE(string: StringRestrictedInputType, old_text: StringRestrictedInputType, new_text: StringRestrictedInputType, count: Optional[IntRestrictedInputType]=None) -> StringFunctionReturnType:
    """
    {
        "function": "SUBSTITUTE",
        "description": "Replaces existing text with new text in a string.",
        "search_terms": ["replace", "find and replace"],
        "category": "TEXT",
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

    if count is None:
        count = -1

    if isinstance(string, str) and isinstance(old_text, str) and isinstance(new_text, str) and isinstance(count, int):
        return string.replace(old_text, new_text, count)

    index = get_index_from_series(string, old_text, new_text, count)
    string = get_series_from_primitive_or_series(string, index).fillna('')
    old_text = get_series_from_primitive_or_series(old_text, index).fillna('')
    new_text = get_series_from_primitive_or_series(new_text, index).fillna('')
    count = get_series_from_primitive_or_series(count, index).fillna(0)

    return pd.Series(
        [s.replace(ot, nt, c) for s, ot, nt, c in zip(string, old_text, new_text, count)],
        index=index
    )


@cast_values_in_arg_to_type('arg', 'str')
@handle_sheet_function_errors
def TEXT(arg: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "TEXT",
        "description": "Turns the passed series into a string.",
        "search_terms": ["string", "dtype"],
        "category": "TEXT",
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
    if isinstance(arg, str):
        return arg
    
    return arg.fillna('')

@cast_values_in_arg_to_type('arg', 'str')
@handle_sheet_function_errors
def TRIM(arg: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "TRIM",
        "description": "Returns a string with the leading and trailing whitespace removed.",
        "search_terms": ["trim", "whitespace", "spaces"],
        "category": "TEXT",
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
    if isinstance(arg, str):
        return arg.strip()

    return arg.fillna('').str.strip()


@cast_values_in_arg_to_type('arg', 'str')
@handle_sheet_function_errors
def UPPER(arg: StringRestrictedInputType) -> StringFunctionReturnType:
    """
    {
        "function": "UPPER",
        "description": "Converts a given string to uppercase.",
        "search_terms": ["uppercase", "capitalize"],
        "category": "TEXT",
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
    if isinstance(arg, str):
        return arg.upper()
    
    return arg.fillna('').str.upper()



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
