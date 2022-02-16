#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the convert_arg_to_series_type decorator.
"""
import pandas as pd
import pytest
from mitosheet.sheet_functions.types.decorators import \
    convert_arg_to_series_type

CONVERT_ARGS_TESTS = [
    (
        pd.Series([True, True, True]),
        'bool',
        pd.Series([True, True, True]),
    ), 
    (
        pd.Series([True, True, True]),
        'string',
        pd.Series(['True', 'True', 'True']),
    ),
    (
        pd.Series([pd.to_datetime('12-12-2020')] * 3),
        'datetime',
        pd.Series([pd.to_datetime('12-12-2020')] * 3),
    ),
    (
        pd.Series([('13-12-2020')] * 3),
        'datetime',
        pd.Series([pd.to_datetime('12-13-2020')] * 3),
    ),
    (
        pd.Series([('12-13-2020')] * 3),
        'datetime',
        pd.Series([pd.to_datetime('12-13-2020')] * 3),
    ),
    (
        pd.Series([('13/12/2020')] * 3),
        'datetime',
        pd.Series([pd.to_datetime('12-13-2020')] * 3),
    ),
    (
        pd.Series([('12/13/2020')] * 3),
        'datetime',
        pd.Series([pd.to_datetime('12-13-2020')] * 3),
    ),
    (
        pd.Series([pd.to_datetime('12-12-2020')] * 3),
        'string',
        pd.Series(['2020-12-12 00:00:00'] * 3),
    ),
    (
        pd.Series([0.0, 1.0, 2.0]),
        'float',
        pd.Series([0.0, 1.0, 2.0]),
    ),
    (
        pd.Series([0.0, 1.0, 2.0]),
        'string',
        pd.Series(['0.0', '1.0', '2.0']),
    ),
    (
        pd.Series(['0.0', '1.0', '2.0']),
        'string',
        pd.Series(['0.0', '1.0', '2.0']),
    ),
    (
        pd.Series(['0.0', '1.0', '2.0']),
        'float',
        pd.Series([0.0, 1.0, 2.0]),
    ),
    
]

@pytest.mark.parametrize("arg, cast_output_type, result", CONVERT_ARGS_TESTS)
def test_filter_nan(arg, cast_output_type, result):

    @convert_arg_to_series_type(
        0,
        cast_output_type,
        on_uncastable_arg='skip',
        on_uncastable_arg_element='error'
    )
    def input_convert(func_arg):
        assert func_arg.equals(result)

    input_convert(arg)

def test_optional():
    @convert_arg_to_series_type(
        0,
        'string',
        on_uncastable_arg='error',
        on_uncastable_arg_element='error',
        optional=True
    )
    def input_convert(func_arg=None):
        assert func_arg is None

    input_convert()
