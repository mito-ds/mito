#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all functions that can be used in a sheet that operate on strings.

NOTE: This file is alphabetical order!
"""
from typing import Union
import sys
import numpy as np

import pandas as pd

from mitosheet.public.v3.sheet_functions.utils import get_final_result_series_or_primitive
from mitosheet.public.v3.types.decorators import cast_values_in_arg_to_type
from mitosheet.public.v3.types.sheet_function_types import StringFunctionReturnType

@cast_values_in_arg_to_type('str')
def CONCAT(*argv: pd.Series) -> StringFunctionReturnType:
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
