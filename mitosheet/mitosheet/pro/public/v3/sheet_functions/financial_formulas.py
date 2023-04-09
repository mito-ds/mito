#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all financial formulas.

All functions describe their behavior with a function documentation object
in the function docstring. Function documentation objects are described
in more detail in docs/README.md.

NOTE: This file is alphabetical order!
"""
import math
from typing import Optional, Union
import sys
import numpy as np

import pandas as pd

from mitosheet.public.v3.errors import handle_sheet_function_errors
from mitosheet.public.v3.rolling_range import RollingRange
from mitosheet.public.v3.sheet_functions.utils import get_final_result_series_or_primitive, get_index_from_series, get_list_from_primitive_series_and_dataframes, get_series_from_primitive_or_series, is_value_nan_or_none
from mitosheet.public.v3.types.decorators import cast_values_in_all_args_to_type, cast_values_in_arg_to_type
from mitosheet.public.v3.types.sheet_function_types import FloatFunctonReturnType, IntFunctionReturnType, IntRestrictedInputType, NumberFunctionReturnType, NumberInputType, NumberRestrictedInputType

@cast_values_in_all_args_to_type('number')
@handle_sheet_function_errors
def NPV(rate: NumberRestrictedInputType, *argv: NumberInputType) -> NumberFunctionReturnType:
    """
        "function": "NPV",
        "description": "Calculates the net present value of a series of cash flows.",
        "search_terms": ["npv", "net present value"],
        "examples": [
            "NPV(0.1, 100, 200, 300, 400)",
            "NPV(A1, A2:A5)"
        ],
        "syntax": "NPV(rate, value1, [value2, ...])",
        "syntax_elements": [{
                "element": "rate",
                "description": "The discount rate."
            }, {
                "element": "value1, value2, ...",
                "description": "The cash flows."
            }
        ]
    """
    
    if rate is None:
        return 0

    # Create the list in the same order Excel does, nice!
    cash_flows = get_list_from_primitive_series_and_dataframes(list(argv))
    # Remove pd.NaN values from cash_flows
    cash_flows = [cash_flow for cash_flow in cash_flows if not is_value_nan_or_none(cash_flow)]

    def npv(rate, cash_flows):
        return sum([cash_flow / ((1 + rate) ** i) for i, cash_flow in enumerate(cash_flows, 1)])

    if isinstance(rate, pd.Series):
        return rate.apply(lambda rate: npv(rate, cash_flows))

    return npv(rate, cash_flows)


FINANCIAL_FORMULAS = {
    'NPV': NPV,
}