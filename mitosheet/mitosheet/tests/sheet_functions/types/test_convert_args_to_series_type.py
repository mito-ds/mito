#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the convert_args_to_series_type decorator.
"""
import pandas as pd
import pytest
from mitosheet.public_interfaces.v1.sheet_functions.types.decorators import \
    convert_args_to_series_type

CONVERT_ARGS_TESTS = [
    (
        [pd.Series([True, True, True]), pd.Series([pd.to_datetime('12-12-2020')] * 3), pd.Series([0, 1, 2]), pd.Series(['True', 'True', 'True'])],
        'bool',
        [pd.Series([True, True, True]), pd.Series([True, True, True]), pd.Series([False, True, True]), pd.Series([True, True, True])]
    ),
    (
        [pd.Series([True, True, True]), pd.Series([pd.to_datetime('12-12-2020')] * 3), pd.Series([0, 1, 2]), pd.Series(['12-12-2020', '12-12-2020', '12-12-2020'])],
        'datetime',
        [pd.Series([pd.to_datetime('12-12-2020')] * 3), pd.Series([pd.to_datetime('12-12-2020')] * 3)]
    ),
    (
        [pd.Series([True, True, True]), pd.Series([pd.to_datetime('12-12-2020')] * 3), pd.Series([0, 1, 2]), pd.Series(['12.12', '13.13', '14.14'])],
        'float',
        [pd.Series([1.0, 1.0, 1.0]), pd.Series([0, 1, 2]), pd.Series([12.12, 13.13, 14.14])]
    ),
    (
        [pd.Series([True, True, True]), pd.Series([pd.to_datetime('12-12-2020')] * 3), pd.Series([0, 1, 2]), pd.Series(['12-12-2020', '12-12-2020', '12-12-2020'])],
        'string',
        [pd.Series(['True', 'True', 'True']), pd.Series(['2020-12-12 00:00:00'] * 3), pd.Series(['0', '1', '2']), pd.Series(['12-12-2020'] * 3)]
    ),
]

@pytest.mark.parametrize("args, cast_output_type, result", CONVERT_ARGS_TESTS)
def test_filter_nan(args, cast_output_type, result):

    @convert_args_to_series_type(
        cast_output_type,
        on_uncastable_arg='skip',
        on_uncastable_arg_element='error'
    )
    def input_convert(*func_args):
        for arg1, arg2 in zip(func_args, result):
            assert arg1.equals(arg2)

    input_convert(*args)
