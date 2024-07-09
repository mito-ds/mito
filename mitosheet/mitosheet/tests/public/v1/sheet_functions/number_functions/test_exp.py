#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains tests for the EXP function.
"""

import pytest
import pandas as pd
import numpy as np
from math import exp

from mitosheet.errors import MitoError
from mitosheet.public.v1.sheet_functions.number_functions import EXP
from mitosheet.tests.test_utils import create_mito_wrapper_with_data

# Raw function tests
EXP_VALID_TESTS = [
    ([1], [exp(1)]),
    ([2], [exp(2)]),
    (['2', '3'], [exp(2), exp(3)]),
    (['2', '3', True], [exp(2), exp(3), exp(1)]),
]
@pytest.mark.parametrize("data, value", EXP_VALID_TESTS)
def test_valid_input_direct(data, value):
    series = pd.Series(data=data)
    assert EXP(series).tolist() == value

# Raw function tests
VALUE_NAN_TESTS = [
    ([np.nan], [True]),
    (['1', np.nan], [False, True]),
    # Booleans get converted, alright
    (['1.1', 'A'], [False, True]),
    ([1, '1.1', 'ABC'], [False, False, True]),
]
@pytest.mark.parametrize("data,is_nan", VALUE_NAN_TESTS)
def test_valid_input_direct_is_nan(data, is_nan):
    series = pd.Series(data=data)
    assert EXP(series).isna().tolist() == is_nan


@pytest.mark.parametrize("data,value", EXP_VALID_TESTS)
def test_valid_input_sheet_function(data, value):
    mito = create_mito_wrapper_with_data(data)
    mito.set_formula('=exp(A)', 0, 'B', add_column=True)
    assert mito.get_column(0, 'B', as_list=True) == value