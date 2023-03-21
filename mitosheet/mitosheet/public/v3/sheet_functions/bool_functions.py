#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all functions that are useful for control flow. For now, this
is just IF statements.

All functions describe their behavior with a function documentation object
in the function docstring. Function documentation objects are described
in more detail in docs/README.md.

NOTE: This file is alphabetical order!
"""
from typing import Union

import pandas as pd

from mitosheet.public.v3.rolling_range import RollingRange
from mitosheet.public.v3.errors import handle_sheet_function_errors
from mitosheet.public.v3.sheet_functions.utils import get_final_result_series_or_primitive
from mitosheet.public.v3.types.decorators import cast_values_in_all_args_to_type
from mitosheet.public.v3.types.sheet_function_types import BoolFunctionReturnType, BoolInputType


@cast_values_in_all_args_to_type('bool')
@handle_sheet_function_errors
def AND(*argv: BoolInputType) -> BoolFunctionReturnType:
    """
    {
        "function": "AND",
        "description": "Returns True if all of the provided arguments are True, and False if any of the provided arguments are False.",
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


@cast_values_in_all_args_to_type('bool')
@handle_sheet_function_errors
def OR(*argv: BoolInputType) -> BoolFunctionReturnType:
    """
    {
        "function": "OR",
        "description": "Returns True if any of the provided arguments are True, and False if all of the provided arguments are False.",
        "search_terms": ["or", "if", "conditional"],
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
    'OR': OR,
}
