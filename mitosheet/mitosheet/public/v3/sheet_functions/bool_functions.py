#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all functions that are useful for control flow. 

All functions describe their behavior with a function documentation object
in the function docstring. Function documentation objects are described
in more detail in docs/README.md.

NOTE: This file is alphabetical order!
"""

from typing import Optional

import pandas as pd

from mitosheet.errors import MitoError
from mitosheet.public.v3.errors import handle_sheet_function_errors
from mitosheet.public.v3.sheet_functions.utils import (
    get_final_result_series_or_primitive, get_series_from_primitive_or_series)
from mitosheet.public.v3.types.decorators import (
    cast_values_in_all_args_to_type, cast_values_in_arg_to_type)
from mitosheet.public.v3.types.sheet_function_types import (
    AnyPrimitiveOrSeriesInputType, BoolFunctionReturnType, BoolInputType,
    BoolRestrictedInputType, IfsInputType)


@cast_values_in_all_args_to_type('bool')
@handle_sheet_function_errors
def AND(*argv: Optional[BoolInputType]) -> BoolFunctionReturnType:
    """
    {
        "function": "AND",
        "description": "Returns True if all of the provided arguments are True, and False if any of the provided arguments are False.",
        "category": "LOGIC",
        "search_terms": ["and", "&", "if", "conditional"],
        "examples": [
            "AND(True, False)",
            "AND(Nums > 100, Nums < 200)",
            "AND(Pay > 10, Pay < 20, Status == 'active')"
        ],
        "syntax": "AND(boolean_condition1, [boolean_condition2, ...])",
        "syntax_elements": [{
                "element": "boolean_condition1",
                "description": "An expression or series that returns True or False values. See IF documentation for a list of conditons."
            },
            {
                "element": "boolean_condition2 ... [OPTIONAL]",
                "description": "An expression or series that returns True or False values. See IF documentation for a list of conditons."
            }
        ]
    }
    """

    # If we don't find any arguements, we default to True. Excel in practice
    # defaults to a value error if there are no args
    return get_final_result_series_or_primitive(
        True,
        argv,
        lambda df: df.all().all(),
        lambda previous_value, new_value: previous_value and new_value,
        lambda previous_series, new_series: previous_series & new_series
    )

@cast_values_in_arg_to_type('series', 'bool')
@handle_sheet_function_errors
def BOOL(series: BoolRestrictedInputType) -> BoolFunctionReturnType:
    """
    {
        "function": "BOOL",
        "description": "Converts the passed arguments to boolean values, either True or False. For numberic values, 0 converts to False while all other values convert to True.",
        "search_terms": ["bool", "boolean", "true", "false", "dtype", "convert"],
        "category": "LOGIC",
        "examples": [
            "BOOL(Amount_Payed)",
            "AND(BOOL(Amount_Payed), Is_Paying)"
        ],
        "syntax": "BOOL(series)",
        "syntax_elements": [{
                "element": "series",
                "description": "An series to convert to boolean values, either True or False."
            }
        ]
    }
    """
    if isinstance(series, bool):
        return series

    return series.fillna(False)

@cast_values_in_arg_to_type('condition', 'bool')
@handle_sheet_function_errors
def IF(condition: pd.Series, true_series: AnyPrimitiveOrSeriesInputType, false_series: AnyPrimitiveOrSeriesInputType) -> pd.Series:
    """
    {
        "function": "IF",
        "description": "Returns one value if the condition is True. Returns the other value if the conditon is False.",
        "search_terms": ["if", "conditional", "and", "or"],
        "category": "LOGIC",
        "examples": [
            "IF(Status == 'success', 1, 0)",
            "IF(Nums > 100, 100, Nums)",
            "IF(AND(Grade >= .6, Status == 'active'), 'pass', 'fail')"
        ],
        "syntax": "IF(boolean_condition, value_if_true, value_if_false)",
        "syntax_elements": [{
                "element": "boolean_condition",
                "description": "An expression or series that returns True or False values. Valid conditions for comparison include ==, !=, >, <, >=, <=."
            },
            {
                "element": "value_if_true",
                "description": "The value the function returns if condition is True."
            },
            {
                "element": "value_if_false",
                "description": "The value the function returns if condition is False."
            }
        ]
    }
    """

    true_series = get_series_from_primitive_or_series(true_series, condition.index)
    false_series = get_series_from_primitive_or_series(false_series, condition.index)

    return pd.Series(
        data=[true_series.loc[i] if c else false_series.loc[i] for i, c in condition.items()],
        index=condition.index
    )


@handle_sheet_function_errors
def IFS(*argv: Optional[IfsInputType]) -> pd.Series:
    """
    {
        "function": "IFS",
        "description": "Returns the value of the first condition that is true. If no conditions are true, returns None.",
        "search_terms": ["ifs", "if", "conditional", "and", "or"],
        "category": "LOGIC",
        "examples": [
            "IFS(height > 100, 'tall', height > 50, 'medium', height > 0, 'short')"
        ],
        "syntax": "IFS(boolean_condition_1, value_if_true, [boolean_condition_2, value_if_true, ...])",
        "syntax_elements": [{
                "element": "boolean_condition",
                "description": "An expression or series that returns True or False values. Valid conditions for comparison include ==, !=, >, <, >=, <=."
            },
            {
                "element": "value_if_true, ... [OPTIONAL]",
                "description": "The value the function returns if condition is True, followed by alternating boolean conditions and values."
            }
        ]
    }
    """
    if len(argv) % 2 != 0:
        raise MitoError(
            'invalid_args_error',
            'IFS',
            'IFS requires an even number of arguments.',
            error_modal=False
        )
    base_index = next(iter(s.index for s in argv if isinstance(s, pd.Series)), None)
    # If index is None, we're dealing with all constants
    if base_index is None:
        for index, arg in enumerate(argv):
            if index % 2 == 0:
                if arg == True:
                    return argv[index+1]
        return None

    else:
        # Otherwise, we have at least one series -- so we can go through and turn all of the constants into series.
        argv_series = tuple([get_series_from_primitive_or_series(arg, base_index) for arg in argv])
        results = pd.Series(index=base_index)

        for index, condition in enumerate(argv_series):
            if index % 2 == 0:
                if condition.dtype != bool:
                    raise MitoError(
                        'invalid_args_error',
                        'IFS',
                        f"IFS requires all even indexed arguments to be boolean.",
                        error_modal=False
                    )
                
                # If it is, use the "true_series" to fill the value in the result series
                true_series = argv_series[index+1]
                new_series = true_series[condition]
                results = results.combine_first(new_series)
                
    return results

@cast_values_in_all_args_to_type('bool')
@handle_sheet_function_errors
def OR(*argv: Optional[BoolInputType]) -> BoolFunctionReturnType:
    """
    {
        "function": "OR",
        "description": "Returns True if any of the provided arguments are True, and False if all of the provided arguments are False.",
        "search_terms": ["or", "if", "conditional"],
        "category": "LOGIC",
        "examples": [
            "OR(True, False)",
            "OR(Status == 'success', Status == 'pass', Status == 'passed')"
        ],
        "syntax": "OR(boolean_condition1, [boolean_condition2, ...])",
        "syntax_elements": [{
                "element": "boolean_condition1",
                "description": "An expression or series that returns True or False values. See IF documentation for a list of conditons."
            },
            {
                "element": "boolean_condition2 ... [OPTIONAL]",
                "description": "An expression or series that returns True or False values. See IF documentation for a list of conditons."
            }
        ]
    }
    """

    # If we don't find any arguements, we default to True. Excel in practice
    # defaults to a value error if there are no args
    return get_final_result_series_or_primitive(
        False,
        argv,
        lambda df: df.any().any(),
        lambda previous_value, new_value: previous_value or new_value,
        lambda previous_series, new_series: previous_series | new_series
    )


# TODO: we should see if we can list these automatically!
CONTROL_FUNCTIONS = {
    'AND': AND,
    'BOOL': BOOL,
    'IF': IF,
    'IFS': IFS,
    'OR': OR,
}
