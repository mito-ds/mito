#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains tests for the cast_output decorator.
"""
from typing import cast
import pandas as pd 
import pytest

from mitosheet.sheet_functions.types.utils import BOOLEAN_SERIES, DATETIME_SERIES, NUMBER_SERIES, STRING_SERIES
from mitosheet.sheet_functions.types.decorators import cast_output


CAST_TESTS = [
    (
        [pd.Series([0, 1, 2])],
        BOOLEAN_SERIES,
        [pd.Series([False, True, True])]
    ),
    (
        [pd.Series([True, True, False])],
        BOOLEAN_SERIES,
        [pd.Series([True, True, False])]
    ),
    (
        [pd.Series(['12-12-2020'] * 3)],
        DATETIME_SERIES,
        [pd.Series([pd.to_datetime('12-12-2020')] * 3)]
    ),
    (
        [pd.Series([pd.to_datetime('12-12-2020')] * 3)],
        DATETIME_SERIES,
        [pd.Series([pd.to_datetime('12-12-2020')] * 3)]
    ),
    (
        [pd.Series([1, 2, 3])],
        NUMBER_SERIES,
        [pd.Series([1, 2, 3])]
    ),
    (
        [pd.Series(['1', '2', '3'])],
        NUMBER_SERIES,
        [pd.Series([1.0, 2.0, 3.0])]
    ),
    (
        [pd.Series([True, True, False])],
        STRING_SERIES,
        [pd.Series(['True', 'True', 'False'])]
    ),
    (
        [pd.Series(['True', 'True', 'False'])],
        STRING_SERIES,
        [pd.Series(['True', 'True', 'False'])]
    ),
    (
        [pd.Series(['True', 'True', 'False']), pd.Series([True, True, True])],
        'first_input_type',
        [pd.Series(['True', 'True', 'True'])]
    ),
    
]

@pytest.mark.parametrize("args, cast_output_type, result", CAST_TESTS)
def test_filter_nan(args, cast_output_type, result):

    @cast_output(cast_output_type)
    def cast_function(*func_args):
        return func_args[-1]

    assert cast_function(*args).equals(result[0])