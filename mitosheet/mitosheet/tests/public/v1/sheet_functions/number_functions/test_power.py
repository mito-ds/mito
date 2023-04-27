#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the POWER function.
"""

import pytest
import pandas as pd
import numpy as np

from mitosheet.public.v1.sheet_functions.number_functions import POWER
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# Raw function tests

POWER_VALID_LITERAL_TESTS = [
    ([1, 2, 3], 2, [1, 4, 9]),
    ([4, 9, 16,], 1/2 , [2, 3, 4]),
    ([4, 9, 16,], .5 , [2, 3, 4]),
    ([4, 9, 16,], '.5' , [2, 3, 4]),
    ([4, 9, 16,], '$.5' , [2, 3, 4]),
    ([1, 2, 3], 2.5, [1, 5.656854249492381, 15.588457268119896]),
    ([1, 2, 3], 0, [1, 1, 1]),
    ([1, None, 3], 2, [1, 'NaN', 9]),
]
@pytest.mark.parametrize("data,power,expected_result", POWER_VALID_LITERAL_TESTS)
def test_POWER_valid_input_number(data, power, expected_result):
    series = pd.Series(data=data)

    power_actual = POWER(series, power)
    power_actual = power_actual.fillna('NaN')

    assert power_actual.tolist() == expected_result


POWER_VALID_SERIES_TESTS = [
    ([1, 2, 3], [2, 2, 2], [1, 4, 9]),
    ([4, 9, 16,], [1/2, 1/2, 1/2], [2, 3, 4]),
    ([4, 9, 16,], [.5, .5, .5] , [2, 3, 4]),
    ([4, 9, 16,], ['$.5', '(.5)', .5] , [2, 0.3333333333333333, 4]),
    ([1, 2, 3], [2.5, 2.5, 2.5], [1, 5.656854249492381, 15.588457268119896]),
    ([1, 2, 3], [0, 0, 0], [1, 1, 1]),
    ([1, None, 3], [2, 2, 2], [1, 'NaN', 9]),
    ([1, None, 3], [2, 2, 3], [1, 'NaN', 27]),
    ([1, None, 3], ['2', '2', '3'], [1, 'NaN', 27]),
    ([1, None, 3], ['2', 2, '3'], [1, 'NaN', 27]),
    ([1, None, 3], ['Aaron', 2, '3'], [1.0, 'NaN', 27]),
    ([1, None, 3], ['Aaron', 'Nate', 'Jake'], [1.0, 'NaN', 3.0]),
    ([1, 2, 3], [2, None, 3], [1, 'NaN', 27]),
    ([1, 2, 3], [2, None, 3], [1, 'NaN', 27]),
    ([1, 2, 4], [2, None, 1/2], [1, 'NaN', 2]),
    ([None, 2, 4], [2, None, 1/2], ['NaN', 'NaN', 2]),
    ([1, 2, None], [2, None, 1/2], [1, 'NaN', 'NaN']),
    ([2, 2, None], [2, None, 2], [4, 'NaN', 'NaN']),
    ([2, 2], ['2', '2'], [4, 4]),
    (['2', '2'], ['2', '2'], [4, 4]),
    (['2', '2'], [2, 2], [4, 4]),
]
@pytest.mark.parametrize("value_array,exponent_array,expected_result", POWER_VALID_SERIES_TESTS)
def test_POWER_valid_input_series(value_array, exponent_array, expected_result):
    df = pd.DataFrame(data = {'value': value_array, 'exponent': exponent_array})

    power_actual = POWER(df['value'], df['exponent'])
    power_actual = power_actual.fillna('NaN')

    assert power_actual.tolist() == expected_result


POWER_INVALID_LITERAL_TESTS = [
    ([1, 2, 3], 'Aaron'),
    ([4, 9, 16,], '---'),
    ([4, 9, 16,], '3/16/21'),
]

@pytest.mark.parametrize("data,power", POWER_INVALID_LITERAL_TESTS)
def test_POWER_invalid_literal_power(data, power):
    mito = create_mito_wrapper_with_data(data)
    mito.set_formula(f'=ROUND(A, {power})', 0, 'B', add_column=True)
    assert mito.get_value(0, 'B', 1) == 0

